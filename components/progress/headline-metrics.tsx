"use client";

import { motion } from "framer-motion";
import { Flame, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  rate: number | null;
  consideredDays: number;
  windowDays: number;
  currentStreak: number;
  bestStreak: number;
}

/**
 * Headline tile pair. Replaces the legacy 6-tile grid:
 *   - Rolling 30-day completion rate as the dominant number (research §3.1).
 *   - Streak chip with current + best subtext.
 *
 * Days 1–6 fall back to "Last {n} days" labelling when the user hasn't
 * accumulated 30 days of data yet (research §7).
 */
export function HeadlineMetrics({
  rate,
  consideredDays,
  windowDays,
  currentStreak,
  bestStreak,
}: Props) {
  const rateLabel =
    consideredDays >= windowDays
      ? `Last ${windowDays} days`
      : `Last ${consideredDays} day${consideredDays === 1 ? "" : "s"}`;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-6">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border bg-card/40 p-4 md:p-6"
      >
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground truncate">
            Completion rate
          </span>
        </div>
        <p
          className="text-4xl md:text-6xl font-light tabular-nums leading-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {rate === null ? "—" : `${Math.round(rate)}`}
          <span className="text-base md:text-2xl text-muted-foreground/60 ml-1">
            %
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{rateLabel}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-xl border bg-card/40 p-4 md:p-6"
        aria-label={`Current streak: ${currentStreak} days, best ${bestStreak} days`}
      >
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <Flame
            className={cn(
              "h-4 w-4 shrink-0",
              currentStreak > 0 ? "text-orange-500" : "text-muted-foreground",
            )}
          />
          <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground truncate">
            Streak
          </span>
        </div>
        <p
          className="text-4xl md:text-6xl font-light tabular-nums leading-none"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {currentStreak}
          <span className="text-base md:text-2xl text-muted-foreground/60 ml-1">
            day{currentStreak === 1 ? "" : "s"}
          </span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground tabular-nums">
          Best: {bestStreak} day{bestStreak === 1 ? "" : "s"}
        </p>
      </motion.div>
    </div>
  );
}
