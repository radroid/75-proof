"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ThemedIcon } from "@/components/earned/icons/themed-icon";
import { EC, SANS } from "@/components/earned/primitives/tokens";

interface Props {
  /** Active hard-habit count for today, sorted by completion (oldest sortOrder first). */
  habitsCompleted: number;
  habitsTotal: number;
  /** Whether the day's hard-rule is satisfied (matches `getDayCompletionMap[currentDay]`). */
  isDayComplete: boolean;
  /** Where to send the user when they tap the Log link. Defaults to /dashboard. */
  href?: string;
  /** Click handler for analytics — fires before navigation. */
  onLogTap?: () => void;
}

/**
 * Read-only one-line snapshot of today's progress (research §3.2). NOT a
 * logging surface — checking off habits stays on `/dashboard`.
 *
 * Earned skin: a cream sticker row that lifts on hover, with the shared
 * `.earned-focusable` keyboard ring. The done-state check is the hand-drawn
 * `ThemedIcon`; the "Log →" arrow stays lucide (no earned variant), coloured
 * to the paper palette. Restyled unconditionally.
 */
export function TodaySnapshot({
  habitsCompleted,
  habitsTotal,
  isDayComplete,
  href = "/dashboard",
  onLogTap,
}: Props) {
  const dots = Array.from({ length: habitsTotal }, (_, i) => i < habitsCompleted);
  const allDone = isDayComplete || (habitsTotal > 0 && habitsCompleted >= habitsTotal);
  // Decorative filled-dot tint: sage when satisfied, deep sky for in-progress —
  // both earned-palette. Sage stays DECORATIVE only: as 14px text it's 3.27:1 on
  // cream (below the 4.5:1 AA floor), so the "All done" label + check render in
  // ink instead. skyDeep "Log" is 5.16:1 and passes as text.
  const dotTint = allDone ? EC.sage : EC.skyDeep;
  const clusterColor = allDone ? EC.ink : EC.skyDeep;

  return (
    <Link
      href={href}
      onClick={onLogTap}
      aria-label={
        allDone
          ? "All today's habits complete — go to dashboard"
          : `${habitsCompleted} of ${habitsTotal} habits done — go to dashboard to log`
      }
      className="earned-focusable group flex items-center justify-between gap-4 px-4 py-3 md:px-5 md:py-4 min-h-[56px] transition-transform hover:-translate-y-0.5"
      style={{
        background: EC.creamLight,
        border: `1.5px solid ${EC.ink}`,
        borderRadius: 12,
        boxShadow: `2px 2px 0 ${EC.ink}`,
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="text-[10px] tracking-[0.2em] uppercase shrink-0"
          style={{ fontFamily: SANS, fontWeight: 600, color: EC.inkSoft }}
        >
          Today
        </span>
        <span
          className="text-sm tabular-nums"
          style={{ fontFamily: SANS, fontWeight: 600, color: EC.ink }}
        >
          {habitsCompleted} of {habitsTotal} done
        </span>
        <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
          {dots.map((filled, i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: filled ? dotTint : EC.rule }}
            />
          ))}
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 text-sm shrink-0"
        style={{ fontFamily: SANS, fontWeight: 600, color: clusterColor }}
      >
        {allDone ? (
          <>
            <ThemedIcon name="check" className="h-4 w-4" />
            <span>All done</span>
          </>
        ) : (
          <>
            <span>Log</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </div>
    </Link>
  );
}
