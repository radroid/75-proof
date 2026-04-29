import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { MEMORY_BYTE_CAP } from "./coach";

const messageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

const MAX_FACTS = 12;
const MAX_FACT_CHARS = 200;

function buildWriterSystemPrompt(firstName: string): string {
  return `You are a memory writer for a coach chatbot. Read the conversation between ${firstName} and the coach and produce a short, durable summary of ${firstName} as JSON.

GOAL
Capture facts that will help future coach sessions personalise advice. Bias toward stable, durable facts (goals, schedule constraints, what's worked, what hasn't, equipment they own, time budget) over transient ones (today's mood, this week's PR).

REDACTION (hard rules)
- Use the first name "${firstName}" as the third-person reference. Do NOT include any other identifier — no last name, full display name, email, phone number, address, social handle, or other free-text identifier.
- Do NOT include third-party names (friends, employers, doctors).
- Do NOT include health diagnoses or medications. Generic constraints are OK ("knee issue, avoid running") but not specifics ("ACL tear from 2024-01 surgery").

DEDUPLICATION (hard rules)
- Each fact must express a distinct idea. If two facts overlap or one is a more specific version of the other, keep ONLY the more specific one.
- Do not restate the same idea in different words across multiple bullets.
- If an existing fact has been contradicted or superseded by the new conversation, drop it or replace it — never keep both the old and new version.

FORMAT
Return ONLY a JSON array of short strings. Each string is one fact, ≤ 200 characters, written in third person using the first name (e.g. "${firstName} prefers morning workouts", not "I prefer morning workouts" and not "User prefers morning workouts"). Up to 12 entries. Order them most-durable first (the writer downstream truncates from the end if the blob exceeds 2KB).

If the conversation contains no durable facts worth saving, return an empty array [].`;
}

/**
 * C-1: Distill the latest exchange into durable memory facts. Called
 * from the Next.js coach chat route after a model response lands.
 *
 * Auth-gated. Skips silently if the caller has memory disabled — the
 * opt-in default is off, so we never write without explicit consent.
 */
export const distillMemoryFromChat = action({
  args: {
    messages: v.array(messageValidator),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { wrote: false, reason: "not_authenticated" };

    const memory = await ctx.runQuery(internal.coach.getMemoryByClerkId, {
      clerkId: identity.subject,
    });
    if (!memory) return { wrote: false, reason: "no_user" };
    if (!memory.enabled) return { wrote: false, reason: "memory_disabled" };

    if (args.messages.length === 0) {
      return { wrote: false, reason: "empty" };
    }

    const facts = await runWriter(args.messages, memory.facts, memory.firstName);
    if (!facts) {
      return { wrote: false, reason: "writer_failed" };
    }

    await ctx.runMutation(internal.coach.replaceMemoryFacts, {
      userId: memory.userId,
      facts,
    });
    return { wrote: true, factCount: facts.length };
  },
});

async function runWriter(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  existingFacts: string[],
  firstName: string,
): Promise<string[] | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Stub mode — keep existing facts. The route still gets called so
    // the audit log behaviour is exercised in dev; but we don't
    // hallucinate fake facts when the model isn't available.
    return existingFacts;
  }

  // Trim transcript to the last few turns — durable facts are usually
  // restated, and the writer doesn't need the whole history.
  const recent = messages.slice(-12);
  const transcript = recent
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");
  const existingBlock =
    existingFacts.length > 0
      ? `\n\nEXISTING FACTS (carry forward what's still true; revise or drop what's not — do NOT keep duplicates):\n${existingFacts
          .map((f, i) => `${i + 1}. ${f}`)
          .join("\n")}`
      : "";

  try {
    const { generateText } = await import("ai");
    const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");
    const openrouter = createOpenRouter({ apiKey });
    const model =
      process.env.OPENROUTER_MEMORY_MODEL ??
      process.env.OPENROUTER_CHAT_MODEL ??
      "anthropic/claude-haiku-4-5";
    // 15s ceiling — the writer prompt is small and the chat itself
    // already returned, so this just guards against OpenRouter
    // stalling and keeping the Convex action open. AbortSignal.timeout
    // is supported in V8 / modern Node and works inside Convex's
    // runtime; fall through to the catch on timeout.
    const result = await generateText({
      model: openrouter.chat(model),
      system: buildWriterSystemPrompt(firstName),
      messages: [
        {
          role: "user",
          content: `CONVERSATION:\n${transcript}${existingBlock}\n\nReturn ONLY the JSON array.`,
        },
      ],
      abortSignal: AbortSignal.timeout(15_000),
    });
    const text = result.text ?? "";
    return parseFactsList(text);
  } catch (err) {
    console.error("[coach.distillMemoryFromChat] writer call failed", err);
    return null;
  }
}

function parseFactsList(text: string): string[] {
  // Find a JSON array in the response. The writer is told to return
  // only an array, but we tolerate fenced code blocks just in case.
  let jsonText: string | null = null;
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(text);
  if (fence) {
    jsonText = fence[1];
  } else {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end > start) {
      jsonText = text.slice(start, end + 1);
    }
  }
  if (!jsonText) return [];
  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!Array.isArray(parsed)) return [];
    const cleaned: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed) continue;
      cleaned.push(trimmed.slice(0, MAX_FACT_CHARS));
      if (cleaned.length >= MAX_FACTS) break;
    }
    return enforceByteCap(dedupeFacts(cleaned));
  } catch {
    return [];
  }
}

/**
 * Drop near-duplicate facts: if one fact's normalized form is contained
 * in another's, keep the longer (more specific) one. Preserves writer
 * order otherwise — the writer is told to put the most-durable facts
 * first, and we want the byte-cap truncation to honor that order.
 */
function dedupeFacts(facts: string[]): string[] {
  const normalized = facts.map(normalizeForDedup);
  const keep = new Array<boolean>(facts.length).fill(true);
  for (let i = 0; i < facts.length; i++) {
    if (!keep[i]) continue;
    for (let j = 0; j < facts.length; j++) {
      if (i === j || !keep[j]) continue;
      const a = normalized[i];
      const b = normalized[j];
      if (!a || !b) continue;
      if (a === b || a.includes(b)) {
        // i is at least as specific as j — drop j.
        keep[j] = false;
      }
    }
  }
  return facts.filter((_, idx) => keep[idx]);
}

function normalizeForDedup(fact: string): string {
  return fact
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function enforceByteCap(facts: string[]): string[] {
  const out = [...facts];
  const enc = new TextEncoder();
  let bytes = 0;
  for (const f of out) bytes += enc.encode(f).byteLength;
  while (out.length > 0 && bytes > MEMORY_BYTE_CAP) {
    const popped = out.pop();
    if (popped) bytes -= enc.encode(popped).byteLength;
  }
  return out;
}
