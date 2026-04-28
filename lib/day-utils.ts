/**
 * Client-side day calculation utilities.
 * Mirrors convex/lib/dayCalculation.ts — same logic, pure functions, no deps.
 */

/** Get today's date string (YYYY-MM-DD) in the user's timezone. */
export function getTodayInTimezone(tz: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
}

/** Parse a YYYY-MM-DD string into a UTC-midnight Date. */
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/** Compute the day number (1-based) given a start date and today's date (both YYYY-MM-DD). */
export function computeDayNumber(startDate: string, todayDate: string): number {
  const start = parseDate(startDate);
  const today = parseDate(todayDate);
  const diffMs = today.getTime() - start.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

/** Is a given day still editable via the normal checklist? Today only.
 *  Past-day edits go through the reconciliation dialog instead. */
export function isDayEditable(dayNumber: number, todayDayNumber: number): boolean {
  return todayDayNumber === dayNumber;
}

/** Add days to a YYYY-MM-DD date string, returning a new YYYY-MM-DD string. */
export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split("T")[0];
}

/** Get the ISO date string (YYYY-MM-DD) for a given day number relative to a start date. */
export function getDateForDay(startDate: string, dayNumber: number): string {
  return addDays(startDate, dayNumber - 1);
}

/** Get the user's IANA timezone string. */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

/** Format a YYYY-MM-DD date for display (e.g. "Mon, Feb 12"). */
export function formatDateShort(dateStr: string): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Resolve the effective challenge length. Returns null for habit-tracker mode. */
export function effectiveDaysTotal(challenge: {
  daysTotal?: number;
  isHabitTracker?: boolean;
}): number | null {
  if (challenge.isHabitTracker) return null;
  return challenge.daysTotal ?? 75;
}

/**
 * Phase of a challenge relative to "today." `currentDay` is the canonical
 * 1-based day counter once active. Future-start challenges (user set a start
 * date later than today) collapse onto the `future` branch with a friendly
 * `label` — UI should never render "Day 0" or "Day -3" anywhere; pre-start
 * users see the countdown instead.
 */
export type ChallengePhase =
  | { kind: "future"; daysUntilStart: number; label: string }
  | { kind: "active"; currentDay: number };

/**
 * Resolve a challenge to its phase given today's date. Same calendar math as
 * `computeDayNumber` (so the active path stays in lockstep with day-keyed
 * Convex queries) — this just adds the pre-start branch.
 */
export function describeChallengePhase(
  startDate: string,
  todayDate: string,
): ChallengePhase {
  const dayNum = computeDayNumber(startDate, todayDate);
  if (dayNum >= 1) return { kind: "active", currentDay: dayNum };
  // dayNum = 0  → starts tomorrow
  // dayNum = -1 → day after tomorrow
  // dayNum = -n → starts in (n + 1) days
  const daysUntilStart = 1 - dayNum;
  let label: string;
  if (daysUntilStart === 1) label = "Starts tomorrow";
  else if (daysUntilStart === 2) label = "Starts day after tomorrow";
  else label = `Starts in ${daysUntilStart} days`;
  return { kind: "future", daysUntilStart, label };
}

/** Format the end date for a challenge as a long-form string (e.g. "Apr 15, 2026"). */
export function formatEndDate(startDate: string, daysTotal: number): string {
  const endIso = getDateForDay(startDate, daysTotal);
  const d = parseDate(endIso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
