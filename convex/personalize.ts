import { v } from "convex/values";
import { action } from "./_generated/server";
import {
  PERSONALIZE_SYSTEM_PROMPT,
  parseProposal,
  type RoutineProposal,
} from "./lib/llmPrompts";

const messageValidator = v.object({
  role: v.union(v.literal("user"), v.literal("assistant")),
  content: v.string(),
});

export type PersonalizeResult = {
  assistantText: string;
  proposal: RoutineProposal | null;
};

/**
 * Drive the personalization chat. Auth-gated: guests never reach this — the
 * client gates the chat panel behind `isGuest === false`. When
 * `OPENROUTER_API_KEY` is unset, returns a deterministic stub so the UI
 * works in dev without keys.
 *
 * Runs in Convex's V8 runtime (no `"use node"` needed) — the AI SDK uses
 * fetch under the hood and bundles fine on the edge runtime.
 */
// Caps on transcript size before we invoke the model. Prevents a malicious
// or buggy client from running up cost / latency by sending huge payloads.
// Generous enough that a normal multi-turn personalization conversation
// doesn't bump into them.
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;

export const chat = action({
  args: {
    messages: v.array(messageValidator),
    selectedTemplateSlug: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<PersonalizeResult> => {
    if (args.messages.length === 0) {
      throw new Error("messages must not be empty");
    }
    if (args.messages.length > MAX_MESSAGES) {
      throw new Error(`Too many messages (max ${MAX_MESSAGES})`);
    }
    for (const m of args.messages) {
      if (m.content.length > MAX_MESSAGE_CHARS) {
        throw new Error(
          `Message too long (max ${MAX_MESSAGE_CHARS} chars per message)`,
        );
      }
    }

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return stubResponse(args.messages.length);
    }

    const { generateText } = await import("ai");
    const { createOpenRouter } = await import("@openrouter/ai-sdk-provider");

    const openrouter = createOpenRouter({ apiKey });
    const model =
      process.env.OPENROUTER_CHAT_MODEL ?? "anthropic/claude-sonnet-4-5";

    // Tell the model which template the user has currently selected so
    // "personalize this routine" requests can adapt instead of inventing.
    const system = args.selectedTemplateSlug
      ? `${PERSONALIZE_SYSTEM_PROMPT}\n\nCURRENT SELECTION\nThe user currently has template slug "${args.selectedTemplateSlug}" selected. If they ask you to personalize, adapt that template unless they ask for something different.`
      : PERSONALIZE_SYSTEM_PROMPT;

    const result = await generateText({
      model: openrouter.chat(model),
      system,
      messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const assistantText = result.text ?? "";
    return {
      assistantText,
      proposal: parseProposal(assistantText),
    };
  },
});

function stubResponse(turn: number): PersonalizeResult {
  if (turn <= 1) {
    return {
      assistantText:
        "(stub mode — set `OPENROUTER_API_KEY` in Convex env to get a real reply)\n\nWhat are you hoping to get out of a daily routine? And how much time can you reliably commit each morning?",
      proposal: null,
    };
  }
  return {
    assistantText:
      "(stub mode) Here's a placeholder proposal you can use to test the UI.\n\n<<ROUTINE_PROPOSAL>>\n```json\n{\n  \"title\": \"Stub Routine\",\n  \"summary\": \"Placeholder while the LLM is unconfigured.\",\n  \"description\": \"Pretend this came from the model.\",\n  \"daysTotal\": 30,\n  \"strictMode\": false,\n  \"difficulty\": \"beginner\",\n  \"habits\": [\n    { \"name\": \"10-min Stretch\", \"blockType\": \"task\", \"isHard\": true, \"category\": \"fitness\", \"icon\": \"flower-2\", \"sortOrder\": 1 },\n    { \"name\": \"Read\", \"blockType\": \"counter\", \"target\": 15, \"unit\": \"min\", \"isHard\": false, \"category\": \"mind\", \"icon\": \"book-open\", \"sortOrder\": 2 }\n  ],\n  \"reasoning\": \"Low-friction starter routine — easy to test the UI.\"\n}\n```",
    proposal: parseProposal(
      "<<ROUTINE_PROPOSAL>>\n```json\n{\"title\":\"Stub Routine\",\"summary\":\"Placeholder while the LLM is unconfigured.\",\"description\":\"Pretend this came from the model.\",\"daysTotal\":30,\"strictMode\":false,\"difficulty\":\"beginner\",\"habits\":[{\"name\":\"10-min Stretch\",\"blockType\":\"task\",\"isHard\":true,\"category\":\"fitness\",\"icon\":\"flower-2\",\"sortOrder\":1},{\"name\":\"Read\",\"blockType\":\"counter\",\"target\":15,\"unit\":\"min\",\"isHard\":false,\"category\":\"mind\",\"icon\":\"book-open\",\"sortOrder\":2}],\"reasoning\":\"Low-friction starter routine — easy to test the UI.\"}\n```",
    ),
  };
}
