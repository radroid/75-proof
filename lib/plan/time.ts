/**
 * Time-of-day math for the Plan timeline. All "minutes" are minutes from
 * local midnight (0..1439). Pure functions — no Convex, no React.
 */

export const MINUTES_PER_DAY = 1440;

/** Parse "HH:mm" (24h) into minutes from midnight. Throws on malformed input. */
export function hhmmToMin(hhmm: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) throw new Error(`Invalid HH:mm: "${hhmm}"`);
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) {
    throw new Error(`Out-of-range HH:mm: "${hhmm}"`);
  }
  return h * 60 + min;
}

/** Format minutes-from-midnight as zero-padded "HH:mm" (24h). Wraps at 24h. */
export function minToHHmm(min: number): string {
  const v = ((Math.round(min) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Round to the nearest 5-minute grid step. */
export function snapTo5(min: number): number {
  return Math.round(min / 5) * 5;
}

/** Round UP to the next 5-minute grid step. */
export function ceilTo5(min: number): number {
  return Math.ceil(min / 5) * 5;
}

/** Clamp a minute value into [lo, hi]. */
export function clampMin(min: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, min));
}

/** Format minutes-from-midnight as a 12h clock, e.g. 870 -> "2:30 PM". */
export function formatClock(min: number): string {
  const v = ((Math.round(min) % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const h24 = Math.floor(v / 60);
  const m = v % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

/** Human duration from minutes: 45 -> "45 min", 75 -> "1h 15m", 60 -> "1h". */
export function formatDuration(min: number): string {
  const v = Math.max(0, Math.round(min));
  if (v < 60) return `${v} min`;
  const h = Math.floor(v / 60);
  const m = v % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Current wall-clock time in `tz`, expressed as minutes from local midnight.
 * Uses Intl so it stays DST-correct. `now` is injectable for testing.
 */
export function nowMinutesInTz(tz: string, now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  let h = 0;
  let m = 0;
  for (const p of parts) {
    if (p.type === "hour") h = Number(p.value) % 24; // "24" -> 0 guard
    if (p.type === "minute") m = Number(p.value);
  }
  return h * 60 + m;
}
