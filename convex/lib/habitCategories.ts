/**
 * Canonical habit category labels and rendering order. Imported by both
 * the client (DynamicDailyChecklist) and Convex queries (todayPulse) so
 * the labels and ordering of habit-category sections never drift.
 *
 * Icon mapping stays local to each consumer because the renderers
 * disagree on type — the React UI wants a `ReactNode`, while the Convex
 * query has to ship a string icon name across the wire.
 */

export const HABIT_CATEGORY_KEYS = [
  "fitness",
  "nutrition",
  "mind",
  "wellness",
  "skill-building",
  "productivity",
  "discipline",
  "personal-development",
  "other",
] as const;

export type HabitCategoryKey = (typeof HABIT_CATEGORY_KEYS)[number];

/**
 * Default order in which categories should render. Categories not in this
 * list fall through to a fallback ordering at the consumer (typically
 * alphabetical, appended after the canonical ones).
 */
export const HABIT_CATEGORY_ORDER: readonly string[] = HABIT_CATEGORY_KEYS;

/**
 * Display labels. Lower-case, short — consumers uppercase or transform
 * them as needed (e.g. the dashboard uses `uppercase tracking-wider`).
 */
export const HABIT_CATEGORY_LABELS: Record<string, string> = {
  fitness: "fitness",
  nutrition: "nutrition",
  mind: "mind",
  wellness: "wellness",
  "skill-building": "skill",
  productivity: "productivity",
  discipline: "discipline",
  "personal-development": "personal",
  other: "other",
};
