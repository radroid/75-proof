"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Minus, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CounterBlockProps {
  name: string;
  isHard: boolean;
  value: number;
  target: number;
  unit: string;
  completed: boolean;
  isEditable: boolean;
  onIncrement: (amount: number) => void;
}

function getIncrementForUnit(unit: string, target: number): number {
  switch (unit) {
    case "oz":
      return 16; // one glass
    case "ml":
      return 250;
    case "min":
      return 5;
    case "pages":
      return 5;
    default:
      if (target <= 5) return 1;
      return target / 5;
  }
}

function formatCounterNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

export function CounterBlock({
  name,
  isHard,
  value,
  target,
  unit,
  completed,
  isEditable,
  onIncrement,
}: CounterBlockProps) {
  const shouldReduceMotion = useReducedMotion();
  const increment = getIncrementForUnit(unit, target);
  const progress = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const formattedValue = formatCounterNumber(value);
  const formattedTarget = formatCounterNumber(target);
  const formattedIncrement = formatCounterNumber(increment);

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors border-b border-border/50 last:border-0 touch-manipulation",
        completed && "opacity-60"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors",
          completed ? "bg-success" : "bg-muted"
        )}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  "text-sm font-medium transition-colors break-words",
                  completed
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                )}
              >
                {name}
              </p>
              <Badge
                variant="outline"
                className={cn(
                  "text-[9px] h-4 px-1 shrink-0",
                  isHard
                    ? "border-destructive/40 text-destructive"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isHard ? "Hard" : "Soft"}
              </Badge>
            </div>
            {!completed && (
              <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                <span className="tabular-nums">{formattedValue}</span>
                {" / "}
                <span className="tabular-nums">{formattedTarget}</span> {unit}
              </p>
            )}
          </div>

          {/* Done indicator */}
          <AnimatePresence>
            {completed && (
              <motion.div
                initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                transition={
                  shouldReduceMotion
                    ? { duration: 0.15 }
                    : { type: "spring", stiffness: 400, damping: 20 }
                }
                className="shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-3 w-3 text-success-foreground" aria-hidden="true" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar + controls */}
        {!completed && isEditable && (
          <div className="mt-3 space-y-2">
            {/* Progress bar */}
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={0}
              aria-valuemax={target}
              aria-label={`${name} progress`}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                className="h-full rounded-full bg-primary"
              />
            </div>

            {/* Increment/decrement buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 p-0 shrink-0 active:scale-95 transition-transform touch-manipulation"
                onClick={() => onIncrement(-increment)}
                disabled={value <= 0}
                aria-label={`Decrease ${name} by ${formattedIncrement} ${unit}`}
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span
                className="text-sm font-semibold min-w-[72px] text-center tabular-nums"
                aria-live="polite"
                aria-atomic="true"
              >
                {formattedValue} {unit}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 p-0 shrink-0 active:scale-95 transition-transform touch-manipulation"
                onClick={() => onIncrement(increment)}
                aria-label={`Increase ${name} by ${formattedIncrement} ${unit}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
