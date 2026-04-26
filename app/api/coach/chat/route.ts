import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export const runtime = "nodejs";

type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

const MAX_MESSAGES = 30;
const MAX_MESSAGE_CHARS = 4000;
const TOP_K = 5;
const VECTOR_SEARCH_TIMEOUT_MS = 15_000;

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

export async function POST(req: NextRequest) {
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
    const convex = new ConvexHttpClient(convexUrl);
    try {
      const result = (await withTimeout(
        convex.action(api.popularRoutines.vectorSearch, {
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
  if (retrieved.length === 0) {
    return `(stub mode — set OPENROUTER_API_KEY in env to get a real reply)\n\nI couldn't retrieve matching routines for "${queryText}". The vector search may not be seeded yet — run \`npx convex run popularRoutines:seedAndEmbed\` from the project root.`;
  }
  const lines = retrieved
    .slice(0, 3)
    .map((r, i) => `${i + 1}. **${r.title}** (${r.duration}) — ${r.summary}`);
  return `(stub mode — set OPENROUTER_API_KEY for a real LLM reply)\n\nTop matches for "${queryText}":\n\n${lines.join("\n")}`;
}
