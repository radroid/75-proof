import {
  getTemplateBySlug,
  isKnownTemplate,
  type RoutineCategory as TemplateCategory,
} from "@/lib/routine-templates";

/**
 * The four-category social-intensity taxonomy used throughout the Progress
 * dashboard and the popular-routines catalog. Sourced from
 * `convex/lib/popularRoutinesSeed.ts` (kept aligned by hand — Convex schema
 * imports can't always cross the lib boundary cleanly in the worker bundle).
 */
export type SocialCategory =
  | "fitness"
  | "skill-building"
  | "productivity"
  | "personal-development";

/**
 * Map the 5-category taxonomy used in `lib/routine-templates.ts` onto the
 * 4-category social taxonomy. Wellness/discipline/mind/custom collapse to
 * personal-development, which gets the quietest social-signal defaults
 * (research §2.8: meditation/journaling/sober-curious lose under
 * leaderboards). Fitness keeps its own slot because it tolerates competition.
 */
function fromTemplateCategory(c: TemplateCategory): SocialCategory {
  switch (c) {
    case "fitness":
      return "fitness";
    case "discipline":
    case "wellness":
    case "mind":
    case "custom":
    default:
      return "personal-development";
  }
}

/**
 * Resolve an active challenge to one of the four social-intensity categories.
 * Reads `templateSlug` only — the schema doesn't carry a category column on
 * `challenges`, so we infer:
 *   - `popular:<slug>` → look up the popular routine's category (deferred —
 *     callers that need the precise category should pass `popularRoutine`).
 *   - known catalog template → map its 5-cat taxonomy onto our 4.
 *   - everything else (ai-generated, custom, missing) → personal-development
 *     (the safest default — never invites unwanted competition).
 *
 * Synchronous + pure so it can run inside React render and onboarding code.
 * Pass an optional `popularRoutine` second argument when you've already
 * fetched the row to avoid the personal-development fallback for popular
 * slugs.
 */
export function resolveSocialCategory(
  templateSlug: string | null | undefined,
  popularRoutine?: { category: SocialCategory } | null,
): SocialCategory {
  if (popularRoutine) return popularRoutine.category;
  if (!templateSlug) return "personal-development";
  if (templateSlug.startsWith("popular:")) return "personal-development";
  if (templateSlug.startsWith("ai-generated:")) return "personal-development";
  if (isKnownTemplate(templateSlug)) {
    return fromTemplateCategory(getTemplateBySlug(templateSlug).category);
  }
  return "personal-development";
}
