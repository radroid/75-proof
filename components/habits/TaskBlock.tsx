"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Lock } from "lucide-react";
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
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors border-b border-border/50 last:border-0",
        isEditable && "cursor-pointer hover:bg-muted/30 -mx-1 px-1 sm:-mx-2 sm:px-2 rounded-lg",
        completed && "opacity-60"
      )}
      onClick={isEditable ? onToggle : undefined}
      role={isEditable ? "button" : undefined}
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
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
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
  );
}
