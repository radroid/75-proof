"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanHabit } from "@/lib/plan/types";

interface Props {
  habits: PlanHabit[];
  onToggleDone: (habit: PlanHabit) => void;
}

/** Check-only habits with no time block (diet, no alcohol, …). */
export function AnytimeTray({ habits, onToggleDone }: Props) {
  if (habits.length === 0) return null;
  return (
    <div className="mt-8 border-t border-border pt-5">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
        Anytime today
      </div>
      <div className="flex flex-wrap gap-2">
        {habits.map((h) => (
          <button
            key={h.id}
            type="button"
            onClick={() => onToggleDone(h)}
            aria-pressed={h.completed}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              h.completed
                ? "border-success/40 bg-success/10 text-success"
                : "border-border bg-background text-foreground hover:bg-muted/40",
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border",
                h.completed
                  ? "border-success bg-success text-success-foreground"
                  : "border-muted-foreground/40",
              )}
            >
              {h.completed && <Check className="h-3 w-3" aria-hidden />}
            </span>
            <span className={cn(h.completed && "line-through")}>{h.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
