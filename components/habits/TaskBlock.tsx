"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TaskBlockProps {
  name: string;
  isHard: boolean;
  completed: boolean;
  isEditable: boolean;
  onToggle: () => void;
}

export function TaskBlock({
  name,
  isHard,
  completed,
  isEditable,
  onToggle,
}: TaskBlockProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 min-h-[56px] transition-colors border-b border-border/50 last:border-0",
        "touch-manipulation select-none",
        isEditable &&
          "cursor-pointer hover:bg-muted/30 active:bg-muted/60 -mx-1 px-1 sm:-mx-2 sm:px-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        completed && "opacity-60"
      )}
      onClick={isEditable ? onToggle : undefined}
      role={isEditable ? "button" : undefined}
      aria-pressed={isEditable ? completed : undefined}
      aria-label={isEditable ? `${name}, ${completed ? "completed" : "not completed"}` : undefined}
      tabIndex={isEditable ? 0 : undefined}
      onKeyDown={
        isEditable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onToggle();
              }
            }
          : undefined
      }
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
            className="shrink-0 self-center"
          >
            <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
              <Check className="h-3 w-3 text-success-foreground" aria-hidden="true" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
