/**
 * Deterministic auto-arrange: place timeline habits into the free window after
 * work, around any already-fixed blocks (done habits, breaks, busy events).
 * Pure + side-effect-free so it is exhaustively unit-tested.
 *
 * All times are minutes from local midnight.
 */

import { ceilTo5, MINUTES_PER_DAY } from "./time";

export interface ArrangeHabit {
  id: string; // habitDefinitionId
  durationMin: number;
}

export interface FixedInterval {
  startMin: number;
  durationMin: number;
}

export interface ArrangeInput {
  /** End of the work block, or null when there's no work today. */
  workEndMin: number | null;
  /** End of the usable evening window (bedtime-ish). */
  windDownMin: number;
  /** Current time in the user's tz, minutes from midnight. */
  nowMin: number;
  /** Habits to place, in the order they should appear. */
  habits: ArrangeHabit[];
  /** Blocks whose times are preserved and must not be overlapped. */
  fixed?: FixedInterval[];
  /** Decompression buffer after work ends (default 15). */
  bufferAfterWorkMin?: number;
  /** Gap between consecutive placed blocks (default 10). */
  interBlockGapMin?: number;
}

export interface ArrangedBlock {
  habitId: string;
  startMin: number;
  durationMin: number;
}

export interface ArrangeResult {
  blocks: ArrangedBlock[];
  /** True if any placed block ends after windDown (window is too tight). */
  overflow: boolean;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Smallest start >= cursor (snapped to 5) where a `dur`-long block fits without
 * overlapping any occupied interval. Jumps past conflicts (+ gap). Bounded loop.
 */
function nextFreeStart(
  cursor: number,
  dur: number,
  occupied: FixedInterval[],
  gap: number,
): number {
  let s = ceilTo5(cursor);
  // At most occupied.length + 1 jumps are ever needed.
  for (let i = 0; i <= occupied.length; i++) {
    const end = s + dur;
    const conflict = occupied.find((f) =>
      overlaps(s, end, f.startMin, f.startMin + f.durationMin),
    );
    if (!conflict) return s;
    s = ceilTo5(conflict.startMin + conflict.durationMin + gap);
  }
  return s;
}

function place(
  input: ArrangeInput,
  buffer: number,
  gap: number,
): { placed: ArrangedBlock[]; dropped: number } {
  const base =
    input.workEndMin != null
      ? Math.max(input.nowMin, input.workEndMin)
      : input.nowMin;
  let cursor = ceilTo5(base) + (input.workEndMin != null ? buffer : 0);

  const occupied: FixedInterval[] = [...(input.fixed ?? [])];
  const placed: ArrangedBlock[] = [];
  let dropped = 0;

  for (const h of input.habits) {
    const dur = Math.max(5, Math.round(h.durationMin));
    const start = nextFreeStart(cursor, dur, occupied, gap);
    // A block that would cross local midnight can't be scheduled today: the
    // reminder cron's wall-clock minute resets to 0 at 00:00 so it could never
    // fire, and the clock label would wrap (e.g. 1460 -> "12:20 AM"). Drop it
    // and let overflow surface instead of persisting an unreachable block.
    if (start + dur > MINUTES_PER_DAY) {
      dropped++;
      continue;
    }
    placed.push({ habitId: h.id, startMin: start, durationMin: dur });
    occupied.push({ startMin: start, durationMin: dur });
    cursor = start + dur + gap;
  }
  return { placed, dropped };
}

function endsAfter(blocks: ArrangedBlock[], windDownMin: number): boolean {
  return blocks.some((b) => b.startMin + b.durationMin > windDownMin);
}

export function autoArrange(input: ArrangeInput): ArrangeResult {
  const buffer = input.bufferAfterWorkMin ?? 15;
  const gap = input.interBlockGapMin ?? 10;

  let { placed, dropped } = place(input, buffer, gap);
  let overflow = dropped > 0 || endsAfter(placed, input.windDownMin);

  // Too tight with the comfortable spacing — try compressed (no buffer, no gap).
  if (overflow) {
    const compressed = place(input, 0, 0);
    placed = compressed.placed;
    overflow = compressed.dropped > 0 || endsAfter(placed, input.windDownMin);
  }

  return { blocks: placed, overflow };
}
