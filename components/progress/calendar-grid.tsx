"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainerFast } from "@/components/ui/motion";
import { useThemePersonality } from "@/components/theme-provider";
import { CrossMarkEarned } from "@/components/earned/icons";

interface Props {
  /** Inclusive day count to render. */
  totalDays: number;
  currentDay: number;
  completionMap: Record<number, boolean>;
}

// Earned cell-state recipe. Each entry IS the sticker — gold-fill +
// ink border for earned days, sky-fill + ink border for today,
// ink-rose border for missed, dashed cream-dark for future. The
// HabitHeatmap reuses the same vocabulary to keep the page coherent.
type EarnedCellState = "earned" | "today" | "missed" | "future";

const EARNED_CELL_STYLES: Record<EarnedCellState, CSSProperties> = {
  earned: {
    backgroundColor: "var(--earned-star-gold)",
    border: "1.5px solid var(--earned-ink)",
    boxShadow: "2px 2px 0 var(--earned-ink)",
  },
  today: {
    backgroundColor: "var(--earned-sky)",
    color: "var(--earned-cream-light)",
    border: "1.5px solid var(--earned-ink)",
    boxShadow: "2px 2px 0 var(--earned-ink)",
  },
  missed: {
    border: "1.5px solid var(--earned-rose)",
    color: "var(--earned-rose)",
  },
  future: {
    border: "1px dashed var(--earned-cream-dark)",
    color: "rgba(31,31,29,0.4)",
  },
};

/**
 * Bounded calendar grid. Three states (research §3.4): complete (filled
 * success), today-pending (outlined ring), missed (ghost), future (muted).
 * Used for fixed-length challenges and as the <90-day fallback for
 * habit-tracker users.
 */
export function CalendarGrid({ totalDays, currentDay, completionMap }: Props) {
  const { personality } = useThemePersonality();
  const isEarned = personality === "earned";

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

          // Earned variant: each cell IS the sticker, not a container
          // for an icon. State recipes live in EARNED_CELL_STYLES so the
          // heatmap can reuse the same vocabulary.
          if (isEarned) {
            const cellState: EarnedCellState = isComplete
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
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center min-w-0",
                  "text-[10px] sm:text-xs cursor-default transition-all",
                )}
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  ...EARNED_CELL_STYLES[cellState],
                }}
                title={`Day ${dayNumber}${isComplete ? " — earned" : isToday ? " — today" : isPast ? " — missed" : ""}`}
              >
                {cellState === "earned" ? (
                  <span aria-hidden />
                ) : cellState === "today" ? (
                  <span className="font-semibold">{dayNumber}</span>
                ) : cellState === "missed" ? (
                  <CrossMarkEarned className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                ) : (
                  <span style={{ fontSize: "0.7rem" }}>{dayNumber}</span>
                )}
              </motion.div>
            );
          }

          // Default (non-Earned themes) — unchanged from the original
          // implementation.
          return (
            <motion.div
              key={dayNumber}
              variants={fadeUp}
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs font-medium cursor-default transition-all min-w-0",
                isComplete
                  ? "bg-success text-success-foreground shadow-sm"
                  : isToday
                    ? "border-2 border-primary text-primary"
                    : isPast
                      ? "bg-destructive/10 text-destructive/60"
                      : "bg-muted text-muted-foreground",
              )}
              title={`Day ${dayNumber}${isComplete ? " — complete" : isToday ? " — today" : isPast ? " — missed" : ""}`}
            >
              {isComplete ? (
                <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              ) : (
                dayNumber
              )}
            </motion.div>
          );
        })}
      </motion.div>
      <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-4 text-xs">
        {isEarned ? (
          <>
            {/* Legend swatches mirror cell affordances — sticker shadow
                on earned + today, hand-drawn cross mark inside the
                missed swatch — so the legend reads as a caption of the
                grid above. */}
            <Legend
              swatch={
                <div
                  className="h-3.5 w-3.5 rounded-sm"
                  style={EARNED_CELL_STYLES.earned}
                />
              }
              label="Showed up"
            />
            <Legend
              swatch={
                <div
                  className="h-3.5 w-3.5 rounded-sm"
                  style={EARNED_CELL_STYLES.today}
                />
              }
              label="Today"
            />
            <Legend
              swatch={
                <div
                  className="h-3.5 w-3.5 rounded-sm flex items-center justify-center"
                  style={EARNED_CELL_STYLES.missed}
                >
                  <CrossMarkEarned className="h-2.5 w-2.5" />
                </div>
              }
              label="Missed"
            />
            <Legend
              swatchClass="border border-dashed border-[var(--earned-cream-dark)]"
              label="Upcoming"
            />
          </>
        ) : (
          <>
            <Legend swatchClass="bg-success" label="Showed up" />
            <Legend swatchClass="border-2 border-primary" label="Today" />
            <Legend swatchClass="bg-destructive/10" label="Missed" />
            <Legend swatchClass="bg-muted" label="Upcoming" />
          </>
        )}
      </div>
    </>
  );
}

function Legend({
  swatchClass,
  swatch,
  label,
}: {
  swatchClass?: string;
  swatch?: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {swatch ? (
        <div className="h-3.5 w-3.5 flex items-center justify-center">
          {swatch}
        </div>
      ) : (
        <div className={cn("h-3.5 w-3.5 rounded-md", swatchClass)} />
      )}
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
