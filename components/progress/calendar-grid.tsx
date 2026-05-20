"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainerFast } from "@/components/ui/motion";
import { useThemePersonality } from "@/components/theme-provider";
import { Star } from "@/components/earned";

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

          // Earned variant: cells become handwritten paper rather than
          // solid colour swatches. Earned days carry a small gold star;
          // missed days a red ink X; today a sky ring with the day
          // number; future cells a faint outline so the page reads as
          // "pages to fill in".
          if (isEarned) {
            return (
              <motion.div
                key={dayNumber}
                variants={fadeUp}
                whileHover={{ scale: 1.08 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className={cn(
                  "aspect-square rounded-md flex items-center justify-center min-w-0",
                  "text-[10px] sm:text-xs",
                  "cursor-default transition-all",
                  isToday && "border-[1.5px] border-primary",
                  !isComplete &&
                    !isToday &&
                    !isPast &&
                    "border border-dashed border-[var(--earned-cream-dark)]",
                )}
                style={{ fontFamily: "var(--font-caveat), 'Caveat', cursive" }}
                title={`Day ${dayNumber}${isComplete ? " — earned" : isToday ? " — today" : isPast ? " — missed" : ""}`}
              >
                {isComplete ? (
                  <Star size={18} />
                ) : isToday ? (
                  <span
                    className="font-semibold"
                    style={{ color: "var(--earned-ink)" }}
                  >
                    {dayNumber}
                  </span>
                ) : isPast ? (
                  <X
                    className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                    style={{ color: "var(--earned-rose)" }}
                    strokeWidth={1.8}
                  />
                ) : (
                  <span
                    className="text-muted-foreground"
                    style={{ fontSize: "0.7rem" }}
                  >
                    {dayNumber}
                  </span>
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
            <Legend swatch={<Star size={14} />} label="Showed up" />
            <Legend
              swatchClass="border-[1.5px] border-primary"
              label="Today"
            />
            <Legend
              swatch={
                <X
                  className="h-3 w-3"
                  style={{ color: "var(--earned-rose)" }}
                  strokeWidth={1.8}
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
