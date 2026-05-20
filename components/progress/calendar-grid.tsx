"use client";

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
          // for an icon. Earned days fill gold with an ink border so
          // the cell reads as a stuck-on gold star at any size; today
          // fills sky with a cream-light digit + 2px ink sticker
          // shadow; missed days carry an ink-rose border + a hand-
          // drawn cross mark; future cells stay faint and dashed.
          if (isEarned) {
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
                  ...(isComplete
                    ? {
                        backgroundColor: "var(--earned-star-gold)",
                        border: "1.5px solid var(--earned-ink)",
                        boxShadow: "2px 2px 0 var(--earned-ink)",
                      }
                    : isToday
                      ? {
                          backgroundColor: "var(--earned-sky)",
                          color: "var(--earned-cream-light)",
                          boxShadow: "2px 2px 0 var(--earned-ink)",
                          border: "1.5px solid var(--earned-ink)",
                        }
                      : isPast
                        ? {
                            border: "1.5px solid var(--earned-rose)",
                            color: "var(--earned-rose)",
                          }
                        : {
                            border:
                              "1px dashed var(--earned-cream-dark)",
                            color: "rgba(31,31,29,0.4)",
                          }),
                }}
                title={`Day ${dayNumber}${isComplete ? " — earned" : isToday ? " — today" : isPast ? " — missed" : ""}`}
              >
                {isComplete ? (
                  // Cell IS the sticker — no inset glyph.
                  <span aria-hidden />
                ) : isToday ? (
                  <span className="font-semibold">{dayNumber}</span>
                ) : isPast ? (
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
            <Legend
              swatch={
                <div
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{
                    backgroundColor: "var(--earned-star-gold)",
                    border: "1.5px solid var(--earned-ink)",
                  }}
                />
              }
              label="Showed up"
            />
            <Legend
              swatch={
                <div
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{
                    backgroundColor: "var(--earned-sky)",
                    border: "1.5px solid var(--earned-ink)",
                  }}
                />
              }
              label="Today"
            />
            <Legend
              swatch={
                <div
                  className="h-3.5 w-3.5 rounded-sm"
                  style={{ border: "1.5px solid var(--earned-rose)" }}
                />
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
