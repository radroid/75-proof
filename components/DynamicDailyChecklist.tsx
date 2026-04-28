"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { useGuest } from "@/components/guest-provider";
import { markDayComplete as localMarkDayComplete } from "@/lib/local-store/mutations";

interface DynamicDailyChecklistProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  isEditable?: boolean;
  userTimezone?: string;
}

// Single source of truth for habit categories. Order is the array order;
// adding or moving a category only requires editing this list. Keep in
// sync with the routine-template category union in `convex/schema.ts`
// (discipline / wellness / fitness / mind / custom) and the popular
// catalog's habit categories (skill-building / productivity /
// personal-development).
const CATEGORY_META = [
  { key: "fitness", label: "fitness", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "nutrition", label: "nutrition", icon: <Apple className="h-4 w-4" /> },
  { key: "mind", label: "mind", icon: <Brain className="h-4 w-4" /> },
  { key: "wellness", label: "wellness", icon: <Sparkles className="h-4 w-4" /> },
  { key: "skill-building", label: "skill", icon: <Brain className="h-4 w-4" /> },
  { key: "productivity", label: "productivity", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "discipline", label: "discipline", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "personal-development", label: "personal", icon: <Sparkles className="h-4 w-4" /> },
  { key: "other", label: "other", icon: <LayoutGrid className="h-4 w-4" /> },
] as const;

const categoryMeta: Record<string, { label: string; icon: React.ReactNode }> =
  Object.fromEntries(CATEGORY_META.map((c) => [c.key, c]));
const categoryOrder: readonly string[] = CATEGORY_META.map((c) => c.key);
const FALLBACK_ICON = <LayoutGrid className="h-4 w-4" />;

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
    requiredItems,
    requiredDone,
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
  const { isGuest } = useGuest();
  const markDayCompleteConvex = useMutation(api.habitEntries.markDayComplete);
  // Track the previous allDone state per (challengeId, dayNumber). Without
  // keying on the day, navigating from an incomplete day to a past complete
  // one would re-fire the celebration on every visit — annoying noise and
  // a duplicate markDayComplete call (deduped server-side, but still a wasted
  // round trip on Convex / a wasted feed lookup locally).
  const prevAllDoneRef = useRef({ key: "", value: false });
  const shouldReduceMotion = useReducedMotion();

  const allDone = requiredItems > 0 && requiredDone === requiredItems;

  useEffect(() => {
    // Wait for the checklist data to load before doing transition detection.
    // Otherwise the effect fires once with `allDone === false` (no entries
    // yet), then again once entries hydrate as `true` for an already-complete
    // past day — re-firing confetti and a duplicate `markDayComplete`.
    if (!habitDefs) return;

    const key = `${challengeId}:${dayNumber}`;
    const prev = prevAllDoneRef.current;
    const isDayChange = prev.key !== key;

    // First effect run for this day after data hydrates: just seed the ref
    // with the current state so an already-done day doesn't read as a flip.
    if (isDayChange) {
      prevAllDoneRef.current = { key, value: allDone };
      return;
    }

    const flippedToDone = allDone && !prev.value;
    if (flippedToDone) {
      triggerConfetti();
      if (isGuest) {
        localMarkDayComplete({
          challengeId: challengeId as unknown as string,
          dayNumber,
        });
      } else {
        markDayCompleteConvex({ challengeId, dayNumber }).catch(() => {
          // Silently ignore — deduplication in backend prevents duplicates
        });
      }
    }
    prevAllDoneRef.current = { key, value: allDone };
  }, [
    habitDefs,
    allDone,
    triggerConfetti,
    markDayCompleteConvex,
    challengeId,
    dayNumber,
    isGuest,
  ]);

  if (!habitDefs) return null;

  // Group by category
  const grouped = new Map<string, typeof habitDefs>();
  for (const habit of habitDefs) {
    const cat = habit.category ?? "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(habit);
  }

  // Render known categories in their canonical order, then any unknown
  // ones (e.g. user-typed custom categories) appended alphabetically so
  // habits never silently disappear from the list.
  const knownInOrder = categoryOrder.filter((c) => grouped.has(c));
  const knownSet = new Set(categoryOrder);
  const extras = Array.from(grouped.keys())
    .filter((c) => !knownSet.has(c))
    .sort();
  const sortedCategories = [...knownInOrder, ...extras];

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
                    {categoryMeta[category]?.icon ?? FALLBACK_ICON}
                  </span>
                  <h3 className="text-xs font-medium uppercase tracking-[0.08em] sm:tracking-[0.15em] text-muted-foreground">
                    {categoryMeta[category]?.label ?? category.replace(/-/g, " ")}
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
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.15 }
                  : { type: "spring", stiffness: 300, damping: 25 }
              }
              className="flex items-center justify-center gap-2 py-6 text-center"
              role="status"
              aria-live="polite"
            >
              <Sparkles className="h-5 w-5 text-success" aria-hidden="true" />
              <p className="text-sm font-medium text-success">
                All hard requirements completed for today!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
