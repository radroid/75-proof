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

/** Is a given day still editable? Day N is editable through the end of day N+2. */
export function isDayEditable(dayNumber: number, todayDayNumber: number): boolean {
  return todayDayNumber <= dayNumber + 2;
}

/** Has the grace period expired for a given day? Expires when today > dayNumber + 2. */
export function isGracePeriodExpired(dayNumber: number, todayDayNumber: number): boolean {
  return todayDayNumber > dayNumber + 2;
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
  const days: number[] = [];
  for (let d = Math.max(1, todayDayNumber - 2); d <= todayDayNumber; d++) {
    days.push(d);
  }
  return days;
}
