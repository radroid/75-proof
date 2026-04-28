"use client";

import { cn } from "@/lib/utils";

interface Props {
  /** Per-day completion. Day 1 is the first day of the challenge. */
  completionMap: Record<number, boolean>;
  currentDay: number;
}

const RAMP_BG = [
  "bg-muted",
  "bg-success/20",
  "bg-success/40",
  "bg-success/60",
  "bg-success",
];

/**
 * GitHub-style heatmap for habit-tracker users with ≥90 days of history.
 * Each cell represents a single day; we render in week columns (oldest →
 * newest, top → bottom = Sun → Sat). Five-step luminance ramp keeps it
 * legible for protanopia/deuteranopia users (research §6 a11y).
 *
 * v1 collapses the binary completionMap onto a 0/4 ramp. The intermediate
 * shades are reserved for a v2 enhancement that pulls per-habit
 * completion-rate per day; today the schema doesn't store that as a
 * pre-aggregated value and computing it inline would over-fetch.
 */
export function HabitHeatmap({ completionMap, currentDay }: Props) {
  // Bucket days into weeks of 7. We pad the leading week so the most
  // recent day sits at the bottom-right of the rightmost column —
  // matches GitHub's intuition (today is here ↘) without a date join.
  const weeks: Array<Array<number | null>> = [];
  let cursor: Array<number | null> = new Array(7).fill(null);
  for (let day = 1; day <= currentDay; day++) {
    cursor[(day - 1) % 7] = day;
    if (day % 7 === 0) {
      weeks.push(cursor);
      cursor = new Array(7).fill(null);
    }
  }
  if (cursor.some((c) => c !== null)) weeks.push(cursor);

  return (
    <div
      className="overflow-x-auto pb-2"
      role="img"
      aria-label={`Activity heatmap: ${currentDay} days, completion shaded green`}
    >
      <div className="flex gap-1 min-w-max">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => {
              if (day === null) {
                return <div key={di} className="h-3 w-3 rounded-sm bg-transparent" />;
              }
              const complete = !!completionMap[day];
              const ramp = complete ? 4 : 0;
              return (
                <div
                  key={di}
                  className={cn(
                    "h-3 w-3 rounded-sm transition-colors",
                    RAMP_BG[ramp],
                  )}
                  title={`Day ${day}${complete ? " — complete" : " — missed"}`}
                />
              );
            })}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {RAMP_BG.map((cls, i) => (
          <span key={i} className={cn("h-3 w-3 rounded-sm", cls)} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
