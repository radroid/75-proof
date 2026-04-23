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

/** Has a missed day passed the 7-day reconciliation window? Cron auto-fails beyond this. */
export function isDayAutoFailExpired(dayNumber: number, todayDayNumber: number): boolean {
  return todayDayNumber > dayNumber + RECONCILIATION_WINDOW_DAYS;
}

/**
 * Highest day number that's eligible for auto-fail (i.e. outside the 7-day
 * reconciliation window). Returns 0 when nothing is past the window yet.
 * Capped at 75 so we never scan beyond the challenge length.
 */
export function getAutoFailUpperBound(todayDayNumber: number): number {
  return Math.min(todayDayNumber - RECONCILIATION_WINDOW_DAYS - 1, 75);
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

/** Get the list of editable day numbers for a given today. */
export function getEditableDays(todayDayNumber: number): number[] {
  if (todayDayNumber < 1) return [];
  if (todayDayNumber > 75) return [];
  return [todayDayNumber];
}

/** Get the list of past day numbers eligible for reconciliation (within the 7-day window). */
export function getReconciliationWindow(todayDayNumber: number): number[] {
  if (todayDayNumber <= 1) return [];
  const start = Math.max(1, todayDayNumber - RECONCILIATION_WINDOW_DAYS);
  const end = Math.min(75, todayDayNumber - 1);
  const days: number[] = [];
  for (let d = start; d <= end; d++) days.push(d);
  return days;
}
