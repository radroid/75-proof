/**
 * Pure derivations for the Progress dashboard. Everything in this module is
 * a synchronous function over data we already fetch via existing Convex
 * queries — `getDayCompletionMap`, `getAllEntriesForChallenge`,
 * `getLifetimeStats` — so we avoid adding new server work for v1.
 */

export interface HabitDefView {
  _id: string;
  name: string;
  isActive: boolean;
  isHard: boolean;
  blockType: "task" | "counter";
  target?: number;
  unit?: string;
  sortOrder: number;
  category?: string;
  icon?: string;
}

export interface HabitEntryView {
  habitDefinitionId: string;
  dayNumber: number;
  completed: boolean;
  value?: number;
}

/**
 * Rolling completion rate (0–100) over the last `windowDays` days, ending on
 * the user's current day. Days the user hasn't reached yet are skipped (we
 * don't punish a Day-3 user for "missing" Days 4–30). Returns null when
 * there's no signal yet.
 */
export function rollingCompletionRate(
  completionMap: Record<number, boolean>,
  currentDay: number,
  windowDays: number,
): {
  rate: number | null;
  completedDays: number;
  consideredDays: number;
} {
  if (currentDay < 1) return { rate: null, completedDays: 0, consideredDays: 0 };
  const start = Math.max(1, currentDay - windowDays + 1);
  const consideredDays = currentDay - start + 1;
  if (consideredDays <= 0)
    return { rate: null, completedDays: 0, consideredDays: 0 };
  let completedDays = 0;
  for (let day = start; day <= currentDay; day++) {
    if (completionMap[day]) completedDays += 1;
  }
  const rate = (completedDays / consideredDays) * 100;
  return { rate, completedDays, consideredDays };
}

/**
 * Effort-based rolling rate (research §2.2 — Apple Rings model). For each
 * day in the window, average each active habit's "% of own daily target":
 *   - task habits: 0 or 1
 *   - counter habits: min(value/target, 1)
 * Then average those daily percentages across the window. Missing days count
 * as 0 (matches research §10 #11 — "missed days count as misses").
 *
 * Intentionally diverges from the binary `rollingCompletionRate` above:
 * effortRate measures *partial credit*, the streak measures *strict
 * consistency*. They should NOT be the same number — research §2.1 says
 * pairing them is the point.
 */
export function effortRollingRate(
  habitDefs: HabitDefView[],
  entries: HabitEntryView[],
  currentDay: number,
  windowDays: number,
): { rate: number | null; consideredDays: number } {
  const active = habitDefs.filter((h) => h.isActive);
  if (currentDay < 1 || active.length === 0) {
    return { rate: null, consideredDays: 0 };
  }
  const start = Math.max(1, currentDay - windowDays + 1);
  const consideredDays = currentDay - start + 1;

  const byDay = new Map<number, Map<string, HabitEntryView>>();
  for (const e of entries) {
    let inner = byDay.get(e.dayNumber);
    if (!inner) {
      inner = new Map();
      byDay.set(e.dayNumber, inner);
    }
    inner.set(e.habitDefinitionId, e);
  }

  let dayPctSum = 0;
  for (let day = start; day <= currentDay; day++) {
    const inner = byDay.get(day);
    let habitSum = 0;
    for (const h of active) {
      const e = inner?.get(h._id);
      if (h.blockType === "counter") {
        const v = e?.value ?? 0;
        const target = h.target ?? 0;
        habitSum +=
          target > 0 ? Math.min(v / target, 1) : e?.completed ? 1 : 0;
      } else {
        habitSum += e?.completed ? 1 : 0;
      }
    }
    dayPctSum += habitSum / active.length;
  }
  const rate = (dayPctSum / consideredDays) * 100;
  return { rate, consideredDays };
}

/**
 * Current streak: consecutive complete days ending at currentDay. If today
 * isn't done yet, falls back to yesterday-anchored. Mirrors the friendship
 * `coStreak` logic (`convex/feed.ts:325`) so the two numbers can sit side by
 * side without confusing the user.
 */
export function currentStreakFrom(
  completionMap: Record<number, boolean>,
  currentDay: number,
): number {
  if (currentDay < 1) return 0;
  const startDay = completionMap[currentDay] ? currentDay : currentDay - 1;
  let streak = 0;
  for (let day = startDay; day >= 1; day--) {
    if (completionMap[day]) streak += 1;
    else break;
  }
  return streak;
}

export interface PerHabitStats {
  habitId: string;
  name: string;
  isHard: boolean;
  blockType: "task" | "counter";
  rate: number;
  completedDays: number;
  consideredDays: number;
  /** Sparkline series: 0 or 1 (or counter %) per day, oldest → newest. */
  series: number[];
  trend: "improving" | "declining" | "steady";
  streak: number;
}

/**
 * Compute per-habit stats over the last `windowDays`. Counter habits weight
 * by `min(value/target, 1)`; task habits are 0/1. Trend is the sign of the
 * linear-regression slope on the series — cheap to compute and good enough
 * to surface "improving" / "declining" annotations (research §3.5).
 */
export function perHabitStats(
  habitDefs: HabitDefView[],
  entries: HabitEntryView[],
  currentDay: number,
  windowDays: number = 30,
): PerHabitStats[] {
  if (currentDay < 1) return [];
  const start = Math.max(1, currentDay - windowDays + 1);
  const consideredDays = currentDay - start + 1;

  // Index entries by habit + day for O(1) lookup.
  const byHabit = new Map<string, Map<number, HabitEntryView>>();
  for (const e of entries) {
    let inner = byHabit.get(e.habitDefinitionId);
    if (!inner) {
      inner = new Map();
      byHabit.set(e.habitDefinitionId, inner);
    }
    inner.set(e.dayNumber, e);
  }

  return habitDefs
    .filter((h) => h.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((h) => {
      const inner = byHabit.get(h._id);
      const series: number[] = [];
      let completedDays = 0;
      for (let day = start; day <= currentDay; day++) {
        const entry = inner?.get(day);
        let value = 0;
        if (h.blockType === "counter") {
          const v = entry?.value ?? 0;
          const target = h.target ?? 0;
          value = target > 0 ? Math.min(v / target, 1) : entry?.completed ? 1 : 0;
        } else {
          value = entry?.completed ? 1 : 0;
        }
        series.push(value);
        if (value >= 1) completedDays += 1;
      }
      const rate = consideredDays > 0 ? (completedDays / consideredDays) * 100 : 0;
      const trend = trendFromSlope(linearSlope(series));
      // Per-habit current streak: consecutive complete days ending today.
      let streak = 0;
      for (let i = series.length - 1; i >= 0; i--) {
        if (series[i] >= 1) streak += 1;
        else break;
      }
      return {
        habitId: h._id,
        name: h.name,
        isHard: h.isHard,
        blockType: h.blockType,
        rate,
        completedDays,
        consideredDays,
        series,
        trend,
        streak,
      };
    });
}

/**
 * Slope of best-fit line through y = b·index + a. We don't need the
 * intercept — only the sign and rough magnitude — so we return slope alone.
 */
function linearSlope(series: number[]): number {
  const n = series.length;
  if (n < 4) return 0; // Too noisy to call.
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += series[i];
    sumXY += i * series[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}

function trendFromSlope(slope: number): "improving" | "declining" | "steady" {
  // Threshold of 0.005 ≈ "0.5% per day shift" → over a 30-day window that's
  // a 15-percentage-point change, which is the smallest one worth calling out.
  if (slope > 0.005) return "improving";
  if (slope < -0.005) return "declining";
  return "steady";
}

/**
 * Aggregate completion across all friends from `getFriendProgress`. Returns
 * a tuple of (finishedToday, totalEligible). Only friends honoring
 * `showCompletionStatus` (i.e. `todayComplete !== null`) count toward the
 * denominator — anyone who hides completion isn't a meaningful signal here.
 */
export function aggregateFriendProgress(
  friendProgress: ReadonlyArray<{ todayComplete: boolean | null } | null>,
): { finishedToday: number; totalEligible: number } {
  let finishedToday = 0;
  let totalEligible = 0;
  for (const fp of friendProgress) {
    if (!fp) continue;
    if (fp.todayComplete === null) continue;
    totalEligible += 1;
    if (fp.todayComplete === true) finishedToday += 1;
  }
  return { finishedToday, totalEligible };
}
