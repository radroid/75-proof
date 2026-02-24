"use client";

import { motion, AnimatePresence } from "framer-motion";
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

function getIncrementForUnit(unit: string): number {
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
      return 1;
  }
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
  const increment = getIncrementForUnit(unit);
  const progress = Math.min((value / target) * 100, 100);

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors border-b border-border/50 last:border-0",
        completed && "opacity-60"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors",
          completed ? "bg-success" : "bg-muted"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p
                className={cn(
                  "text-sm font-medium transition-colors",
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
                  "text-[9px] h-4 px-1",
                  isHard
                    ? "border-destructive/40 text-destructive"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isHard ? "Hard" : "Soft"}
              </Badge>
            </div>
            {!completed && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {value} / {target} {unit}
              </p>
            )}
          </div>

          {/* Done indicator */}
          <AnimatePresence>
            {completed && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar + controls */}
        {!completed && isEditable && (
          <div className="mt-3 space-y-2">
            {/* Progress bar */}
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-full bg-primary"
              />
            </div>

            {/* Increment/decrement buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 sm:h-7 sm:w-7 p-0"
                onClick={() => onIncrement(-increment)}
                disabled={value <= 0}
              >
                <Minus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </Button>
              <span className="text-xs font-medium min-w-[60px] text-center">
                {value} {unit}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 sm:h-7 sm:w-7 p-0"
                onClick={() => onIncrement(increment)}
              >
                <Plus className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
