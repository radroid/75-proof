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
  // Sage for the satisfied state, deep sky for the call-to-log — both live in
  // the earned paper palette (no raw green/blue).
  const accent = allDone ? EC.sage : EC.skyDeep;

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
              style={{ background: filled ? accent : EC.rule }}
            />
          ))}
        </div>
      </div>
      <div
        className="flex items-center gap-1.5 text-sm shrink-0"
        style={{ fontFamily: SANS, fontWeight: 600, color: accent }}
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
