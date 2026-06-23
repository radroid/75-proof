/**
 * Smart defaults for how long a habit takes and whether it belongs on the
 * timeline or in the "anytime" tray. Pure + deterministic so auto-arrange is
 * testable. Users can override both via the stored `estimatedMinutes` /
 * `defaultPlacement` fields; these only fill the gap when those are absent.
 */

import type { Placement } from "./types";

export interface HabitLike {
  name: string;
  blockType: "task" | "counter";
  target?: number;
  unit?: string;
  category?: string;
  estimatedMinutes?: number;
  defaultPlacement?: Placement;
}

const MINUTE_UNITS = new Set(["min", "mins", "minute", "minutes", "m"]);

/** Default estimated minutes for a habit, before any user override. */
export function defaultDuration(habit: HabitLike): number {
  const unit = habit.unit?.trim().toLowerCase();
  const name = habit.name.toLowerCase();

  // Counter habits encode their own duration when measured in minutes.
  if (habit.blockType === "counter" && habit.target && habit.target > 0) {
    if (unit && MINUTE_UNITS.has(unit)) {
      return clampDuration(habit.target);
    }
    if (unit === "pages") {
      // ~1.5 min/page is a gentle reading estimate.
      return clampDuration(Math.ceil(habit.target * 1.5));
    }
  }

  // Name/category heuristics for task habits (and non-minute counters).
  if (/workout|exercise|run|gym|lift|cardio|yoga|walk|train/.test(name)) return 45;
  if (/meditat|breath|mindful/.test(name)) return 10;
  if (/journal|write|reflect/.test(name)) return 15;
  if (/read/.test(name)) return 20;
  if (/cold shower|shower|stretch/.test(name)) return 10;

  if (habit.category === "fitness") return 45;
  if (habit.category === "mind") return 15;

  // Generic fallback.
  return 15;
}

/** Clamp an estimate into a sane block-length range (5 min .. 4 h). */
function clampDuration(min: number): number {
  return Math.max(5, Math.min(240, Math.round(min)));
}

// A strong "this is a timed activity" signal — a named, time-bounded thing.
// Checked FIRST so a real activity ("No-equipment workout", "Sugar-free baking
// practice", "Zero to one reading") isn't misrouted to the anytime tray by an
// incidental abstinence/diet substring. Word-ish boundaries avoid matching
// inside other words (e.g. "read" inside "bread"/"already").
const TIMELINE_SIGNAL =
  /workout|exercise|\brun|\bgym|\blift|cardio|yoga|\bwalk|train|meditat|breath|mindful|journal|\bwrit|reflect|\bread|stretch|shower|\bstudy|practice/i;
// Abstinence / "avoid X" style habits — no meaningful time block. Anchored to
// the phrase start (or an explicit "no <thing>") so a trailing/incidental word
// can't pull a real activity off the timeline.
const ABSTINENCE =
  /^(no|avoid|quit|zero|cut)\b|\bno (alcohol|sugar|soda|junk|caffeine|phone)\b|alcohol|cheat meal|\bsmok|\bvap/i;
// "Follow a diet" style adherence habits — also ambient, not a time block.
const DIET_ADHERENCE = /\bdiet\b|clean eating|meal prep|whole ?foods/i;

/**
 * Where a habit lands by default. "anytime" for binary lifestyle/abstinence
 * habits that have no meaningful time block (diet adherence, no alcohol);
 * "timeline" for everything with a real duration. A named activity always wins
 * over an abstinence/diet guess so it keeps its time block + reminders.
 */
export function inferPlacement(habit: HabitLike): Placement {
  // Counters with a real numeric target are doable in a sitting -> timeline.
  if (habit.blockType === "counter" && habit.target && habit.target > 0) {
    return "timeline";
  }
  const name = habit.name.toLowerCase();
  if (TIMELINE_SIGNAL.test(name)) return "timeline";
  if (ABSTINENCE.test(name)) return "anytime";
  if (DIET_ADHERENCE.test(name)) return "anytime";
  return "timeline";
}

/** Effective duration: explicit override wins, else heuristic. */
export function resolveDuration(habit: HabitLike): number {
  if (typeof habit.estimatedMinutes === "number" && habit.estimatedMinutes > 0) {
    return clampDuration(habit.estimatedMinutes);
  }
  return defaultDuration(habit);
}

/** Effective placement: explicit override wins, else heuristic. */
export function resolvePlacement(habit: HabitLike): Placement {
  return habit.defaultPlacement ?? inferPlacement(habit);
}
