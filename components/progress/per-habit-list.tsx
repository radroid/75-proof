"use client";

import { motion } from "framer-motion";
import { TrendingDown, Minus } from "lucide-react";
import { ThemedIcon } from "@/components/earned/icons/themed-icon";
import { EC, HAND, SANS } from "@/components/earned/primitives/tokens";
import type { PerHabitStats } from "@/lib/progress-metrics";

interface Props {
  stats: PerHabitStats[];
}

/**
 * Sparkline-per-habit list — the routine-agnostic replacement for the legacy
 * Workouts/Water/Reading tile row. Renders 30-day rolling rate per habit
 * with a tiny inline sparkline and an improving/declining annotation
 * (research §3.5).
 *
 * Earned skin (restyled unconditionally): cream sticker rows, handwritten
 * (Caveat) protagonist percentage, an ink "progress line" sparkline, and
 * ThemedIcon trend chips. All small text is ink/inkSoft for contrast; the
 * trend colour lives only on the glyph, never the label.
 */
export function PerHabitList({ stats }: Props) {
  if (stats.length === 0) {
    return (
      <p className="text-sm" style={{ fontFamily: SANS, color: EC.inkSoft }}>
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
          className="grid grid-cols-[1fr_auto_auto] items-center gap-3 md:gap-4 px-3 py-3"
          style={{
            background: EC.creamLight,
            border: `1.5px solid ${EC.ink}`,
            borderRadius: 12,
            boxShadow: `2px 2px 0 ${EC.ink}`,
          }}
        >
          <div className="min-w-0 flex items-center gap-2">
            <span
              className="text-sm truncate"
              style={{ fontFamily: SANS, fontWeight: 600, color: EC.ink }}
            >
              {s.name}
            </span>
            {s.isHard && (
              <span
                className="inline-flex items-center h-4 px-1.5 text-[9px] tracking-wider uppercase shrink-0"
                style={{
                  fontFamily: SANS,
                  fontWeight: 700,
                  color: EC.ink,
                  border: `1.5px solid ${EC.ink}`,
                  borderRadius: 999,
                  lineHeight: 1,
                }}
              >
                Hard
              </span>
            )}
          </div>
          <Sparkline series={s.series} />
          <div className="text-right shrink-0">
            <p
              className="text-sm tabular-nums"
              style={{ fontFamily: HAND, fontWeight: 700, fontSize: 18, color: EC.ink }}
            >
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
  // Compact 96×24 "progress line": a dashed cream baseline with a solid ink
  // fill proportional to the habit's rolling completion — reads as a pen
  // stroke filling the track, not a coloured chart.
  const w = 96;
  const h = 24;
  const n = series.length;
  if (n === 0) return <div className="hidden md:block w-24" />;
  const completion = series.reduce((a, b) => a + b, 0) / n;
  const midY = h / 2;
  const inkX = Math.round(completion * (w - 4)) + 2;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className="hidden md:block"
      aria-hidden="true"
    >
      <line
        x1={2}
        y1={midY}
        x2={w - 2}
        y2={midY}
        stroke={EC.creamDark}
        strokeWidth={2}
        strokeDasharray="3 3"
        strokeLinecap="round"
      />
      {inkX > 2 && (
        <line
          x1={2}
          y1={midY}
          x2={inkX}
          y2={midY}
          stroke={EC.ink}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function TrendChip({ trend }: { trend: "improving" | "declining" | "steady" }) {
  // Label text always inkSoft (≥4.5:1); only the glyph carries the trend hue.
  const base =
    "inline-flex items-center gap-0.5 text-[10px] tabular-nums justify-end";
  if (trend === "improving") {
    return (
      <span className={base} style={{ color: EC.inkSoft }}>
        <span style={{ color: EC.sage, display: "inline-flex" }}>
          <ThemedIcon name="trending-up" className="h-3 w-3" />
        </span>{" "}
        improving
      </span>
    );
  }
  if (trend === "declining") {
    return (
      <span className={base} style={{ color: EC.inkSoft }}>
        <span style={{ color: EC.rose, display: "inline-flex" }}>
          <TrendingDown className="h-3 w-3" />
        </span>{" "}
        declining
      </span>
    );
  }
  return (
    <span className={base} style={{ color: EC.inkSoft }}>
      <Minus className="h-3 w-3" /> steady
    </span>
  );
}
