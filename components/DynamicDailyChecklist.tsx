"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Check, Dumbbell, Apple, Brain, Sparkles, Lock, LayoutGrid } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import { TaskBlock } from "@/components/habits/TaskBlock";
import { CounterBlock } from "@/components/habits/CounterBlock";
import { useHabitEntries } from "@/hooks/use-habit-entries";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface DynamicDailyChecklistProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  isEditable?: boolean;
  userTimezone?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  fitness: <Dumbbell className="h-4 w-4" />,
  nutrition: <Apple className="h-4 w-4" />,
  mind: <Brain className="h-4 w-4" />,
  other: <LayoutGrid className="h-4 w-4" />,
};

const categoryOrder = ["fitness", "nutrition", "mind", "other"];

export function DynamicDailyChecklist({
  challengeId,
  userId,
  dayNumber,
  date,
  isEditable = true,
  userTimezone,
}: DynamicDailyChecklistProps) {
  const {
    habitDefs,
    entryMap,
    totalItems,
    totalDone,
    handleToggleTask,
    handleUpdateCounter,
  } = useHabitEntries({
    challengeId,
    userId,
    dayNumber,
    date,
    userTimezone,
    isEditable,
  });

  const { isActive: confettiActive, trigger: triggerConfetti } = useConfetti();
  const markDayComplete = useMutation(api.habitEntries.markDayComplete);
  const prevAllDoneRef = useRef(false);

  const allDone = totalItems > 0 && totalDone === totalItems;

  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      triggerConfetti();
      markDayComplete({ challengeId, dayNumber }).catch(() => {
        // Silently ignore — deduplication in backend prevents duplicates
      });
    }
    prevAllDoneRef.current = allDone;
  }, [allDone, triggerConfetti, markDayComplete, challengeId, dayNumber]);

  if (!habitDefs) return null;

  // Group by category
  const grouped = new Map<string, typeof habitDefs>();
  for (const habit of habitDefs) {
    const cat = habit.category ?? "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(habit);
  }

  const sortedCategories = categoryOrder.filter((c) => grouped.has(c));

  return (
    <>
      <Confetti isActive={confettiActive} />

      {!isEditable && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 mb-4">
          <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-sm text-muted-foreground">
            This day is locked. You can only view past entries.
          </p>
        </div>
      )}

      <div className={cn("space-y-10", !isEditable && "opacity-75 pointer-events-none")}>
        {sortedCategories.map((category) => {
          const habits = grouped.get(category)!;
          const catComplete = habits.every((h) => {
            const entry = entryMap.get(h._id);
            return entry?.completed;
          });

          return (
            <div key={category}>
              {/* Section header */}
              <div className="flex items-center justify-between mb-1 pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <span className={cn("transition-colors", catComplete ? "text-success" : "text-muted-foreground")}>
                    {categoryIcons[category] ?? categoryIcons.other}
                  </span>
                  <h3 className="text-xs font-medium uppercase tracking-[0.08em] sm:tracking-[0.15em] text-muted-foreground">
                    {category}
                  </h3>
                </div>
                {catComplete && (
                  <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px] h-5">
                    <Check className="mr-1 h-2.5 w-2.5" />
                    Done
                  </Badge>
                )}
              </div>

              {/* Habit items */}
              <div>
                {habits.map((habit) => {
                  const entry = entryMap.get(habit._id);

                  if (habit.blockType === "counter") {
                    return (
                      <CounterBlock
                        key={habit._id}
                        name={habit.name}
                        isHard={habit.isHard}
                        value={entry?.value ?? 0}
                        target={habit.target ?? 1}
                        unit={habit.unit ?? ""}
                        completed={entry?.completed ?? false}
                        isEditable={isEditable}
                        onIncrement={(amount) =>
                          handleUpdateCounter(
                            habit._id,
                            entry?.value ?? 0,
                            amount
                          )
                        }
                      />
                    );
                  }

                  return (
                    <TaskBlock
                      key={habit._id}
                      name={habit.name}
                      isHard={habit.isHard}
                      completed={entry?.completed ?? false}
                      isEditable={isEditable}
                      onToggle={() => handleToggleTask(habit._id)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* All requirements status */}
        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center justify-center gap-2 py-6 text-center"
            >
              <Sparkles className="h-5 w-5 text-success" />
              <p className="text-sm font-medium text-success">
                All requirements completed for today!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
