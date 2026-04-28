"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PerHabitStats } from "@/lib/progress-metrics";

interface Props {
  stats: PerHabitStats[];
}

/**
 * Sparkline-per-habit list — the routine-agnostic replacement for the legacy
 * Workouts/Water/Reading tile row. Renders 30-day rolling rate per habit
 * with a tiny inline sparkline and an improving/declining annotation
 * (research §3.5).
 */
export function PerHabitList({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Habits will appear here once you have a few days of data.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {stats.map((s, i) => (
        <motion.div
          key={s.habitId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: Math.min(i * 0.04, 0.3) }}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 md:gap-4 rounded-lg border bg-card/40 px-3 py-3"
        >
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-sm font-medium truncate">{s.name}</span>
            {s.isHard && (
              <Badge
                variant="outline"
                className="h-4 px-1 text-[9px] tracking-wider uppercase border-primary/40 text-primary"
              >
                Hard
              </Badge>
            )}
          </div>
          <Sparkline series={s.series} />
          <div className="text-right shrink-0">
            <p className="text-sm font-medium tabular-nums">
              {Math.round(s.rate)}%
            </p>
            <TrendChip trend={s.trend} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function Sparkline({ series }: { series: number[] }) {
  // Compact 96×24 SVG. Each step is a thin vertical bar — easier to parse
  // than a polyline at this size and forgives the 0/1 binary domain.
  const w = 96;
  const h = 24;
  const n = series.length;
  if (n === 0) return <div className="hidden md:block w-24" />;
  const stepW = w / Math.max(n, 1);
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="hidden md:block text-success"
      aria-hidden="true"
    >
      {series.map((v, i) => {
        const barH = Math.max(1, v * (h - 2));
        return (
          <rect
            key={i}
            x={i * stepW + 0.5}
            y={h - barH - 1}
            width={Math.max(stepW - 1, 1)}
            height={barH}
            className={cn(
              "fill-current",
              v >= 1 ? "opacity-90" : v >= 0.5 ? "opacity-50" : "opacity-20",
            )}
          />
        );
      })}
    </svg>
  );
}

function TrendChip({ trend }: { trend: "improving" | "declining" | "steady" }) {
  if (trend === "steady") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground tabular-nums">
        <Minus className="h-3 w-3" /> steady
      </span>
    );
  }
  if (trend === "improving") {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] text-success tabular-nums">
        <TrendingUp className="h-3 w-3" /> improving
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] text-warning tabular-nums">
      <TrendingDown className="h-3 w-3" /> declining
    </span>
  );
}
