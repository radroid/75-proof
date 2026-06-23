"use client";

import { Button } from "@/components/ui/button";
import { CalendarClock } from "lucide-react";

/** First-run state: no saved schedule and no plan yet. */
export function PlanEmptyState({ onSetHours }: { onSetHours: () => void }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <CalendarClock className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
      <h2
        className="text-lg font-medium text-foreground"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Plan your evening
      </h2>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
        Set your work hours and we’ll fit your habits into the time you have
        left after work.
      </p>
      <Button onClick={onSetHours} className="mt-6" size="lg">
        Set today’s work hours
      </Button>
    </div>
  );
}
