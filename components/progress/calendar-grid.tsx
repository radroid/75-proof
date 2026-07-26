"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeUp, staggerContainerFast } from "@/components/ui/motion";
import { EC, HAND } from "@/components/earned/primitives/tokens";
import { CrossMarkEarned } from "@/components/earned/icons/cross-mark";

interface Props {
  /** Inclusive day count to render. */
  totalDays: number;
  currentDay: number;
  completionMap: Record<number, boolean>;
}

type CellState = "earned" | "today" | "missed" | "future";

// Earned paper sticker cells (restyled unconditionally — the app is on the
// earned theme). Earned = gold sticker with a hard ink offset shadow (the
// gold-star brand thesis); today = deep-sky sticker; missed = a hand-drawn
// rose cross; future = a faint dashed outline. Small text stays ink/inkSoft
// for contrast; colour is only ever a fill or the cross glyph.
const CELL_STYLE: Record<CellState, React.CSSProperties> = {
  earned: {
    background: EC.gold,
    color: EC.ink,
    border: `1.5px solid ${EC.ink}`,
    boxShadow: `2px 2px 0 ${EC.ink}`,
    fontFamily: HAND,
    fontWeight: 700,
  },
  today: {
    background: EC.skyDeep,
    color: EC.creamLight,
    border: `1.5px solid ${EC.ink}`,
    boxShadow: `2px 2px 0 ${EC.ink}`,
    fontFamily: HAND,
    fontWeight: 700,
  },
  missed: {
    border: `1.5px solid ${EC.rose}`,
    color: EC.rose,
  },
  future: {
    border: `1px dashed ${EC.creamDark}`,
    color: EC.inkSoft,
    fontFamily: HAND,
    fontWeight: 700,
  },
};

/**
 * Bounded calendar grid. Four states (research §3.4): earned (gold sticker),
 * today (sky sticker), missed (rose cross), future (dashed). Used for
 * fixed-length challenges and as the <90-day fallback for habit-tracker users.
 */
export function CalendarGrid({ totalDays, currentDay, completionMap }: Props) {
  return (
    <>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainerFast}
        className="grid grid-cols-15 gap-1 sm:gap-1.5 min-w-0"
      >
        {Array.from({ length: totalDays }, (_, i) => {
          const dayNumber = i + 1;
          const isComplete = !!completionMap[dayNumber];
          const isToday = dayNumber === currentDay;
          const isPast = dayNumber < currentDay;
          const state: CellState = isComplete
            ? "earned"
            : isToday
              ? "today"
              : isPast
                ? "missed"
                : "future";
          return (
            <motion.div
              key={dayNumber}
              variants={fadeUp}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs cursor-default transition-all min-w-0"
              style={CELL_STYLE[state]}
              title={`Day ${dayNumber}${isComplete ? " — complete" : isToday ? " — today" : isPast ? " — missed" : ""}`}
            >
              {state === "missed" ? (
                <CrossMarkEarned className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              ) : (
                dayNumber
              )}
            </motion.div>
          );
        })}
      </motion.div>
      <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-4 text-xs">
        <Legend swatch={<Swatch state="earned" />} label="Completed" />
        <Legend swatch={<Swatch state="today" />} label="Today" />
        <Legend swatch={<Swatch state="missed" cross />} label="Missed" />
        <Legend swatch={<Swatch state="future" />} label="Upcoming" />
      </div>
    </>
  );
}

function Swatch({ state, cross }: { state: CellState; cross?: boolean }) {
  return (
    <div
      className="h-3.5 w-3.5 rounded-md flex items-center justify-center"
      style={CELL_STYLE[state]}
    >
      {cross && <CrossMarkEarned className="h-2.5 w-2.5" />}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {swatch}
      <span style={{ color: EC.inkSoft }}>{label}</span>
    </div>
  );
}
