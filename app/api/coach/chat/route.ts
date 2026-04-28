import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant"; content: string };

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;
const TOP_K = 5;
const VECTOR_SEARCH_TIMEOUT_MS = 15_000;

// Call a Convex action via its HTTP `/api/action` endpoint instead of the
// `convex/browser` client. The client transitively pulls in `ws`, `bufferutil`,
// and `node-gyp-build`, none of which load on Cloudflare Workers — bundling
// them broke the entire route module so production requests crashed before
// POST ever ran ("ComponentMod.handler is not a function"). A direct fetch
// keeps this route Workers-safe.
async function runConvexAction<T>(
  baseUrl: string,
  path: string,
  args: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  if (!res.ok) {
    throw new Error(
      `Convex action ${path} failed: HTTP ${res.status} ${await res.text().catch(() => "")}`.trim(),
    );
  }
  const body = (await res.json()) as
    | { status: "success"; value: T }
    | { status: "error"; errorMessage: string; errorData?: unknown };
  if (body.status === "error") {
    throw new Error(`Convex action ${path} returned error: ${body.errorMessage}`);
  }
  return body.value;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

const CATEGORIES = new Set([
  "fitness",
  "skill-building",
  "productivity",
  "personal-development",
]);

const ALLOWED_ROLES = new Set<ChatMessage["role"]>(["user", "assistant"]);

// Best-effort per-IP rate limit. The coach endpoint must remain reachable
// for unauthenticated guest-mode users (sidebar exposes /dashboard/coach
// in `guestNavItems`), so a Clerk gate is not appropriate here. Instead
// we cap each client IP to RATE_LIMIT_MAX requests per RATE_LIMIT_WINDOW_MS.
//
// Caveat: this is single-process state. On multi-instance deployments
// (Cloudflare Workers, multi-region Node) it acts as a per-instance soft
// throttle, not a global one. Move to KV/Redis if abuse becomes real.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
// Eviction threshold — once a bucket hasn't been touched for this long it's
// dropped. 2× the window leaves a small grace period for clock skew.
const RATE_LIMIT_TTL_MS = RATE_LIMIT_WINDOW_MS * 2;
// Probabilistic sweep: ~1 in 100 requests triggers a full pass. Keeps the
// map bounded under unique-IP pressure without paying GC cost on every call.
const RATE_LIMIT_GC_PROBABILITY = 0.01;
const RATE_LIMIT_GC_HARD_THRESHOLD = 5000;

type RateLimitBucket = { times: number[]; lastSeen: number };
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function sweepRateLimitBuckets(now: number) {
  const evictBefore = now - RATE_LIMIT_TTL_MS;
  for (const [key, bucket] of rateLimitBuckets) {
    if (bucket.lastSeen < evictBefore) {
      rateLimitBuckets.delete(key);
    }
  }
}

function rateLimit(req: NextRequest): { ok: true } | { ok: false; retryAfter: number } {
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  if (ip === "unknown" && process.env.NODE_ENV !== "production") {
    // In dev this usually just means localhost; in production it means the
    // proxy isn't forwarding client IPs and many requests will share the
    // single "unknown" bucket. Surface it loudly during development so
    // misconfigured deployments don't silently degrade rate limiting.
    console.warn(
      "[coach/chat] rateLimit could not determine client IP — check cf-connecting-ip / x-forwarded-for / x-real-ip headers from upstream proxy",
    );
  }
  const now = Date.now();
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  const existing = rateLimitBuckets.get(ip);
  const times = (existing?.times ?? []).filter((t) => t > cutoff);

  if (
    Math.random() < RATE_LIMIT_GC_PROBABILITY ||
    rateLimitBuckets.size > RATE_LIMIT_GC_HARD_THRESHOLD
  ) {
    sweepRateLimitBuckets(now);
  }

  if (times.length >= RATE_LIMIT_MAX) {
    rateLimitBuckets.set(ip, { times, lastSeen: now });
    const retryAfter = Math.ceil((times[0] + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { ok: false, retryAfter: Math.max(1, retryAfter) };
  }
  times.push(now);
  rateLimitBuckets.set(ip, { times, lastSeen: now });
  return { ok: true };
}

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) {
    // No Origin header (e.g. server-to-server, curl) — accept; Clerk-protected
    // areas don't gate this and we don't want to break tooling.
    return true;
  }
  const host = req.headers.get("host");
  if (!host) return false;
  try {
    const url = new URL(origin);
    return url.host === host;
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
  }
  const limit = rateLimit(req);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: {
    messages?: ChatMessage[];
    category?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { error: `Too many messages (max ${MAX_MESSAGES})` },
      { status: 400 },
    );
  }
  for (const m of messages) {
    if (!m || typeof m.content !== "string") {
      return NextResponse.json({ error: "Bad message shape" }, { status: 400 });
    }
    if (!ALLOWED_ROLES.has(m.role)) {
      return NextResponse.json(
        { error: "Invalid message role" },
        { status: 400 },
      );
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return NextResponse.json(
        { error: `Message too long (max ${MAX_MESSAGE_CHARS})` },
        { status: 400 },
      );
    }
  }

  const category =
    body.category && CATEGORIES.has(body.category)
      ? (body.category as
          | "fitness"
          | "skill-building"
          | "productivity"
          | "personal-development")
      : undefined;

  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return NextResponse.json(
      { error: "Convex URL not configured" },
      { status: 500 },
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const queryText = lastUser?.content?.trim() ?? "";

  type Retrieved = {
    slug: string;
    title: string;
    category: string;
    summary: string;
    whatItIs: string;
    duration: string;
    trackingChecklist: string[];
    whyItMatters: string;
    caveat?: string;
    tags: string[];
    sourceUrl?: string;
    score: number;
  };

  let retrieved: Retrieved[] = [];
  let retrievalFailed = false;
  let retrievalError: string | undefined;

  if (queryText) {
    try {
      const result = (await withTimeout(
        runConvexAction<Retrieved[]>(convexUrl, "popularRoutines:vectorSearch", {
          query: queryText,
          limit: TOP_K,
          category,
        }),
        VECTOR_SEARCH_TIMEOUT_MS,
        "vector search",
      )) as Retrieved[];
      retrieved = result;
    } catch (err) {
      // Log full error server-side; only surface a generic message to the client.
      console.error("[coach/chat] vector search failed", err);
      retrieved = [];
      retrievalFailed = true;
      retrievalError = "Failed to retrieve routines";
    }
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      assistantText: stubResponse(queryText, retrieved),
      retrieved,
      retrievalFailed,
      retrievalError,
    });
  }

  const { generateText } = await import("ai");
  const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
  const openrouter = createOpenRouter({ apiKey });
  const model =
    process.env.OPENROUTER_CHAT_MODEL ?? "anthropic/claude-sonnet-4.5";

  const system = buildSystemPrompt(retrieved, category);

  try {
    const result = await generateText({
      model: openrouter.chat(model),
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });
    return NextResponse.json({
      assistantText: result.text ?? "",
      retrieved,
      retrievalFailed,
      retrievalError,
    });
  } catch (err) {
    console.error("[coach/chat] LLM call failed", err);
    return NextResponse.json(
      {
        assistantText:
          "Sorry — the coach is having trouble reaching the model right now. Try again in a moment.",
        retrieved,
        retrievalFailed,
        retrievalError,
        llmFailed: true,
      },
      { status: 503 },
    );
  }
}

function buildSystemPrompt(
  retrieved: Array<{
    slug: string;
    title: string;
    category: string;
    summary: string;
    whatItIs: string;
    duration: string;
    trackingChecklist: string[];
    whyItMatters: string;
    caveat?: string;
    tags: string[];
  }>,
  category: string | undefined,
): string {
  const catLine = category
    ? `The user is browsing the "${category}" category. Bias your suggestions toward routines in that category, but feel free to mention adjacent ones if a stack would help.`
    : `The user has not picked a category yet. If their intent is unclear, ask one short question to narrow it down before recommending.`;

  const context =
    retrieved.length > 0
      ? retrieved
          .map(
            (r, i) => `[${i + 1}] ${r.title} (slug: ${r.slug}, category: ${r.category}, duration: ${r.duration})
Summary: ${r.summary}
What it is: ${r.whatItIs}
Tags: ${r.tags.length > 0 ? r.tags.join(", ") : "—"}
Tracking: ${r.trackingChecklist.join("; ") || "—"}
Why it matters: ${r.whyItMatters}${r.caveat ? `\nCaveat: ${r.caveat}` : ""}`,
          )
          .join("\n\n")
      : "(no retrieved routines — answer from general knowledge but say so)";

  return `You are 75 Proof's Routine Coach. You help people pick or stack daily/weekly habit routines from a curated catalog of 80+ widely-followed challenges (75 Hard, Huberman protocol, Pomodoro, Atomic Habits, etc.).

${catLine}

GROUNDING
You have been given the top retrieved routines below from a vector search over the catalog. PREFER these. If the user's intent doesn't fit any retrieved routine well, say so and suggest the closest match — never invent a routine name that isn't in the catalog.

When you mention a routine, name it exactly as it appears (e.g. "75 Hard Challenge", "Cal Newport's deep work blocks").

STYLE
- Be concise. 2–4 short paragraphs max, or a tight bulleted list.
- Lead with the recommendation, then 1–2 sentences on why it fits, then the daily/weekly tracking it requires.
- If the user is asking about safety, surface the Caveat field verbatim.
- If the user gives ambiguous goals, ask ONE focused follow-up before recommending.
- Don't lecture. No "Great question!" openers.

RETRIEVED ROUTINES
${context}`;
}

function stubResponse(
  queryText: string,
  retrieved: Array<{ title: string; slug: string; summary: string; duration: string }>,
): string {
  // Generic, non-sensitive message — operational details (env var names,
  // setup commands) are intentionally kept out of the response body so
  // they aren't surfaced to end users in production.
  if (retrieved.length === 0) {
    return `(coach is in fallback mode — full LLM replies are not available right now.)\n\nNo matching routines were retrieved for "${queryText}".`;
  }
  const lines = retrieved
    .slice(0, 3)
    .map((r, i) => `${i + 1}. **${r.title}** (${r.duration}) — ${r.summary}`);
  return `(coach is in fallback mode — showing top vector-search matches without an LLM summary.)\n\nTop matches for "${queryText}":\n\n${lines.join("\n")}`;
}
