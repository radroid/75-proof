"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, staggerContainerFast } from "@/components/ui/motion";

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
        <Legend swatchClass="bg-success" label="Completed" />
        <Legend swatchClass="border-2 border-primary" label="Today" />
        <Legend swatchClass="bg-destructive/10" label="Missed" />
        <Legend swatchClass="bg-muted" label="Upcoming" />
      </div>
    </>
  );
}

function Legend({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={cn("h-3.5 w-3.5 rounded-md", swatchClass)} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
