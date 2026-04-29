import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";
import { MEMORY_BIO_CHAR_CAP } from "./coach";

const messageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

const UNCHANGED_SENTINEL = "UNCHANGED";

function buildWriterSystemPrompt(firstName: string): string {
  return `You maintain a single short, friendly bio paragraph about ${firstName} that future coach sessions read to personalise advice.

DECIDE
Does the conversation reveal *durable* new information about ${firstName} that the bio should reflect? Durable = goals, schedule, preferences, constraints, equipment, what's worked, what hasn't. Not durable = today's mood, this week's PR, transient feelings already implied by the existing bio.

If nothing durable was learned, or everything is already captured in the existing bio, reply with the literal token ${UNCHANGED_SENTINEL} and nothing else.

OTHERWISE rewrite the bio:
- 2–4 sentences, ≤ ${MEMORY_BIO_CHAR_CAP} characters total.
- Fun, light, warm tone — like a friend describing ${firstName} to another friend. Use the first name "${firstName}" (first name only) in third person.
- Resolve contradictions: drop superseded facts and replace them with the new one. Never keep the old version alongside the new.
- Normalise relative dates to absolute (e.g. "last Monday" → an explicit ISO date inferred from context).
- Consolidate overlapping ideas into one clean phrase.

REDACTION (hard rules)
- No last name, email, address, phone number, social handle, or other free-text identifier.
- No third-party names (friends, employers, doctors).
- No health diagnoses or medications. Generic constraints are OK ("knee issue, avoid running") but specifics are not ("ACL tear from 2024-01 surgery").

OUTPUT
Plain prose only. No JSON, no quotes, no preamble, no headings. Or the single token ${UNCHANGED_SENTINEL}.`;
}

/**
 * C-1: Distill the latest exchange into a friendly bio paragraph.
 * Called from the Next.js coach chat route after a model response
 * lands.
 *
 * Auth-gated. Skips silently if the caller has memory disabled — the
 * opt-in default is off, so we never write without explicit consent.
 *
 * The writer is asked to return either an updated bio paragraph or the
 * literal token UNCHANGED. UNCHANGED skips the mutation entirely so a
 * conversation that revealed nothing durable produces no audit row and
 * no write.
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

    const next = await runWriter(
      args.messages,
      memory.bio,
      memory.legacyFacts,
      memory.firstName,
    );
    if (next === null) {
      return { wrote: false, reason: "writer_failed" };
    }
    if (next === "UNCHANGED") {
      return { wrote: false, reason: "unchanged" };
    }

    await ctx.runMutation(internal.coach.replaceMemoryBio, {
      userId: memory.userId,
      bio: next,
    });
    return { wrote: true, chars: next.length };
  },
});

async function runWriter(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  existingBio: string,
  legacyFacts: string[],
  firstName: string,
): Promise<string | "UNCHANGED" | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Stub mode — leave the bio alone. The route still calls us so the
    // audit log behaviour is exercised in dev; we don't hallucinate a
    // bio when the model isn't available.
    return "UNCHANGED";
  }

  // Trim transcript to the last few turns — durable facts are usually
  // restated, and the writer doesn't need the whole history.
  const recent = messages.slice(-12);
  const transcript = recent
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n\n");

  const existingBlock = existingBio
    ? `EXISTING BIO:\n"${existingBio}"`
    : `EXISTING BIO:\n(none yet — write the first one if the conversation reveals durable info)`;

  // One-time migration seed: if the user has legacy bullet-list facts
  // but no bio yet, fold them into the first paragraph.
  const legacyBlock =
    !existingBio && legacyFacts.length > 0
      ? `\n\nLEGACY FACTS (from a previous bullet-list memory model — fold the still-true ones into the new paragraph; drop anything stale):\n${legacyFacts
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
    // stalling and keeping the Convex action open.
    const result = await generateText({
      model: openrouter.chat(model),
      system: buildWriterSystemPrompt(firstName),
      messages: [
        {
          role: "user",
          content: `${existingBlock}${legacyBlock}\n\nCONVERSATION:\n${transcript}\n\nReturn either the new bio as plain prose, or the literal token ${UNCHANGED_SENTINEL}.`,
        },
      ],
      abortSignal: AbortSignal.timeout(15_000),
    });
    return parseBioOrUnchanged(result.text ?? "");
  } catch (err) {
    console.error("[coach.distillMemoryFromChat] writer call failed", err);
    return null;
  }
}

function parseBioOrUnchanged(text: string): string | "UNCHANGED" {
  const trimmed = stripWrapping(text.trim());
  if (!trimmed) return "UNCHANGED";
  if (trimmed.toUpperCase() === UNCHANGED_SENTINEL) return "UNCHANGED";
  return trimmed.slice(0, MEMORY_BIO_CHAR_CAP);
}

function stripWrapping(text: string): string {
  // Tolerate fenced code blocks and surrounding quotes — the prompt
  // says no JSON / quotes / preamble, but models occasionally add
  // them. We don't want a delightful little prose paragraph dropped
  // because the model wrapped it in ```.
  const fence = /^```(?:[a-zA-Z]+)?\s*([\s\S]*?)```$/.exec(text);
  let out = fence ? fence[1].trim() : text;
  // Strip a single matching pair of surrounding quotes.
  if (
    (out.startsWith('"') && out.endsWith('"')) ||
    (out.startsWith("'") && out.endsWith("'"))
  ) {
    out = out.slice(1, -1).trim();
  }
  return out;
}
