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

// Abstinence / "avoid X" style habits — no meaningful time block.
const ABSTINENCE = /\bno\b|\bavoid\b|\bquit\b|\bzero\b|alcohol|cheat|sugar|smok|vap/i;
// "Follow a diet" style adherence habits — also ambient, not a time block.
const DIET_ADHERENCE = /\bdiet\b|clean eating|meal prep|whole ?foods/i;

/**
 * Where a habit lands by default. "anytime" for binary lifestyle/abstinence
 * habits that have no meaningful time block (diet adherence, no alcohol);
 * "timeline" for everything with a real duration.
 */
export function inferPlacement(habit: HabitLike): Placement {
  // Counters with a real numeric target are doable in a sitting -> timeline.
  if (habit.blockType === "counter" && habit.target && habit.target > 0) {
    return "timeline";
  }
  const name = habit.name.toLowerCase();
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
