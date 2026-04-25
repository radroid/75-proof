/**
 * Shared pure utility functions for day calculation logic.
 * Used by both server-side Convex functions and can be mirrored client-side.
 * No Convex imports — these are plain TypeScript.
 */

/** Get today's date string (YYYY-MM-DD) in a given timezone. */
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

/** How many days back a missed day remains reconcilable via the dialog. */
export const RECONCILIATION_WINDOW_DAYS = 7;

/** Is a given day still editable via the normal checklist? Today only. */
export function isDayEditable(dayNumber: number, todayDayNumber: number): boolean {
  return todayDayNumber === dayNumber;
}

/**
 * Highest day number that's eligible for auto-fail (i.e. outside the 7-day
 * reconciliation window). Returns 0 or less when nothing is past the window
 * yet. Capped at the challenge length so we never scan beyond it; pass null
 * for habit-tracker mode (no upper cap).
 */
export function getAutoFailUpperBound(
  todayDayNumber: number,
  daysTotal: number | null = 75
): number {
  const beyondWindow = todayDayNumber - RECONCILIATION_WINDOW_DAYS - 1;
  return daysTotal === null ? beyondWindow : Math.min(beyondWindow, daysTotal);
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

/** Get the list of editable day numbers for a given today. Pass null for habit-tracker mode (no upper bound). */
export function getEditableDays(
  todayDayNumber: number,
  daysTotal: number | null = 75
): number[] {
  if (todayDayNumber < 1) return [];
  if (daysTotal !== null && todayDayNumber > daysTotal) return [];
  return [todayDayNumber];
}

/** Get the list of past day numbers eligible for reconciliation (within the 7-day window). Pass null for habit-tracker mode. */
export function getReconciliationWindow(
  todayDayNumber: number,
  daysTotal: number | null = 75
): number[] {
  if (todayDayNumber <= 1) return [];
  const start = Math.max(1, todayDayNumber - RECONCILIATION_WINDOW_DAYS);
  const upper = todayDayNumber - 1;
  const end = daysTotal === null ? upper : Math.min(daysTotal, upper);
  const days: number[] = [];
  for (let d = start; d <= end; d++) days.push(d);
  return days;
}

/**
 * Resolve the effective challenge length. Returns null for habit-tracker mode
 * (no end date), the stored daysTotal when set, or 75 for legacy rows that
 * predate the configurable-duration feature.
 */
export function effectiveDaysTotal(challenge: {
  daysTotal?: number;
  isHabitTracker?: boolean;
}): number | null {
  if (challenge.isHabitTracker) return null;
  return challenge.daysTotal ?? 75;
}
