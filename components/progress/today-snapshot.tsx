"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <Link
      href={href}
      onClick={onLogTap}
      aria-label={
        allDone
          ? "All today's habits complete — go to dashboard"
          : `${habitsCompleted} of ${habitsTotal} habits done — go to dashboard to log`
      }
      className={cn(
        "group flex items-center justify-between gap-4 rounded-xl border px-4 py-3 md:px-5 md:py-4 transition-colors",
        "min-h-[56px] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        allDone
          ? "border-success/30 bg-success/5 hover:bg-success/10"
          : "bg-card/40 hover:bg-card/60",
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground shrink-0">
          Today
        </span>
        <span className="text-sm font-medium tabular-nums">
          {habitsCompleted} of {habitsTotal} done
        </span>
        <div className="hidden sm:flex items-center gap-1" aria-hidden="true">
          {dots.map((filled, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                filled
                  ? allDone
                    ? "bg-success"
                    : "bg-primary"
                  : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-primary shrink-0">
        {allDone ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-success">All done</span>
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
