import { ROUTINE_TEMPLATE_SEEDS } from "./routineTemplatesSeed";

/**
 * Sentinel marker the model wraps a structured routine proposal in. We pair
 * it with a fenced ```json``` block so prose mentions of "{...}" never get
 * mistaken for a proposal.
 */
export const PROPOSAL_SENTINEL = "<<ROUTINE_PROPOSAL>>";

export const PERSONALIZE_SYSTEM_PROMPT = `You are 75 Proof's onboarding coach. The user is choosing a daily routine to commit to.

CONTEXT
You are the ONLY surface where this user is asked about their goals, schedule, and habit preferences. The standard onboarding form only collected age + a health acknowledgement — everything else is on you. Don't assume the user already answered "what are your goals" elsewhere; they didn't.

GOAL
Help the user end up with a routine they can stick to. Either adapt one of the curated templates below, or design a fresh routine if none fit.

CONVERSATION STYLE
1. Read the user's first message. If they've already given enough context (primary goal, constraints, time budget, equipment, habit preferences), skip straight to a proposal — prior failures are useful but not required to take this fast path.
2. Otherwise, ask ONE focused question per turn. Cap follow-ups at 5 total. Cover, in roughly this order: primary goal, time/equipment constraints, habit preferences/current routine, lifestyle non-negotiables, prior failures (optional but useful).
3. Be concise. No motivational fluff. Don't restate what the user just said.

PROPOSAL FORMAT
When you propose a routine, emit it as a fenced JSON block tagged with the sentinel below. Keep prose around it short — the user will see it rendered as a card.

${PROPOSAL_SENTINEL}
\`\`\`json
{
  "title": "string",
  "summary": "one-line marketing copy",
  "description": "1-2 paragraphs",
  "daysTotal": <integer between 7 and 365>,
  "strictMode": <boolean — true means missing any habit restarts from day 1>,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "habits": [
    { "name": "string", "blockType": "task" | "counter", "target": <number or null>, "unit": "string or null", "isHard": <boolean>, "category": "fitness" | "nutrition" | "mind" | "other", "icon": "lucide-icon-name", "sortOrder": <integer starting at 1> }
  ],
  "reasoning": "why this fits the user — 1-3 sentences"
}
\`\`\`

REVISIONS
If the user critiques a proposal, emit a NEW ${PROPOSAL_SENTINEL} block with the revised routine. Don't try to diff inline — replace the whole thing.

GROUNDING
Prefer adapting one of the curated templates over inventing. Only invent if none fit. Curated catalog (compact):

${JSON.stringify(
  ROUTINE_TEMPLATE_SEEDS.map((t) => ({
    slug: t.slug,
    title: t.title,
    summary: t.summary,
    daysTotal: t.daysTotal,
    strictMode: t.strictMode,
    habits: t.habits.map((h) => h.name),
  })),
  null,
  2,
)}
`;

export interface RoutineProposal {
  title: string;
  summary: string;
  description: string;
  daysTotal: number;
  strictMode: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  habits: Array<{
    name: string;
    blockType: "task" | "counter";
    target?: number | null;
    unit?: string | null;
    isHard: boolean;
    category: string;
    icon: string;
    sortOrder: number;
  }>;
  reasoning: string;
}

/**
 * Extract the most recent routine proposal from a model response. Returns
 * null when no sentinel-tagged JSON block is present or it fails to parse.
 */
export function parseProposal(text: string): RoutineProposal | null {
  const sentinelIdx = text.lastIndexOf(PROPOSAL_SENTINEL);
  if (sentinelIdx === -1) return null;
  const after = text.slice(sentinelIdx);
  const fenceMatch = /```(?:json)?\s*([\s\S]*?)```/.exec(after);
  if (!fenceMatch) return null;
  try {
    const parsed = JSON.parse(fenceMatch[1]) as unknown;
    if (!isRoutineProposal(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

const VALID_DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const VALID_BLOCK_TYPES = ["task", "counter"] as const;

function isRoutineProposal(value: unknown): value is RoutineProposal {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  if (typeof p.title !== "string") return false;
  if (typeof p.summary !== "string") return false;
  if (typeof p.description !== "string") return false;
  if (typeof p.daysTotal !== "number" || !Number.isFinite(p.daysTotal)) return false;
  // Match the system prompt contract: integer days, 7..365 inclusive.
  if (!Number.isInteger(p.daysTotal) || p.daysTotal < 7 || p.daysTotal > 365) {
    return false;
  }
  if (typeof p.strictMode !== "boolean") return false;
  if (
    typeof p.difficulty !== "string" ||
    !VALID_DIFFICULTIES.includes(p.difficulty as (typeof VALID_DIFFICULTIES)[number])
  ) {
    return false;
  }
  if (typeof p.reasoning !== "string") return false;
  if (!Array.isArray(p.habits) || p.habits.length === 0) return false;
  return p.habits.every((h) => {
    if (!h || typeof h !== "object") return false;
    const habit = h as Record<string, unknown>;
    if (typeof habit.name !== "string") return false;
    if (
      typeof habit.blockType !== "string" ||
      !VALID_BLOCK_TYPES.includes(habit.blockType as (typeof VALID_BLOCK_TYPES)[number])
    ) {
      return false;
    }
    if (typeof habit.isHard !== "boolean") return false;
    if (typeof habit.category !== "string") return false;
    if (typeof habit.icon !== "string") return false;
    if (typeof habit.sortOrder !== "number" || !Number.isFinite(habit.sortOrder)) {
      return false;
    }
    if (
      habit.target !== undefined &&
      habit.target !== null &&
      (typeof habit.target !== "number" || !Number.isFinite(habit.target))
    ) {
      return false;
    }
    if (
      habit.unit !== undefined &&
      habit.unit !== null &&
      typeof habit.unit !== "string"
    ) {
      return false;
    }
    return true;
  });
}
