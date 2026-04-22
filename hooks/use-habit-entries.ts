"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";

interface UseHabitEntriesArgs {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  userTimezone?: string;
  isEditable: boolean;
}

export function useHabitEntries({
  challengeId,
  userId,
  dayNumber,
  date,
  userTimezone,
  isEditable,
}: UseHabitEntriesArgs) {
  const habitDefs = useQuery(api.habitDefinitions.getActiveHabitDefinitions, {
    challengeId,
  });

  const entries = useQuery(api.habitEntries.getEntriesForDay, {
    challengeId,
    dayNumber,
  });

  const toggleTask = useMutation(api.habitEntries.toggleTaskEntry);
  const updateCounter = useMutation(api.habitEntries.updateCounterEntry);

  const entryMap = new Map(
    (entries ?? []).map((e) => [e.habitDefinitionId, e])
  );

  // Keep the latest completion state available to click handlers without
  // forcing useCallback to re-create on every render (entryMap is a fresh
  // ref each render). This lets us predict at tap time whether the toggle
  // will complete the day — needed so the success haptic fires inside the
  // trusted-event window iOS 18.4+ enforces for navigator.vibrate(). The
  // post-mutation confetti effect is too late for that window.
  const stateRef = useRef({ habitDefs, entryMap });
  stateRef.current.habitDefs = habitDefs;
  stateRef.current.entryMap = entryMap;

  const guardEdit = useCallback((): boolean => {
    if (!isEditable) {
      toast.error("This day is locked and can no longer be edited.");
      return false;
    }
    return true;
  }, [isEditable]);

  const handleToggleTask = useCallback(
    async (habitDefinitionId: Id<"habitDefinitions">) => {
      if (!guardEdit()) return;

      // Predict: is this tap going to flip the last required habit to done?
      // If yes, fire success haptic; otherwise a regular impact. Both fire
      // synchronously — iOS gates navigator.vibrate() on a recent click.
      const defs = stateRef.current.habitDefs;
      const em = stateRef.current.entryMap;
      const required = defs?.filter((h) => h.isHard) ?? [];
      const requiredCount = required.length;
      let requiredDoneAfter = 0;
      let willFlip = false;
      for (const h of required) {
        const wasDone = Boolean(em.get(h._id)?.completed);
        const flipsNow = h._id === habitDefinitionId;
        const doneAfter = flipsNow ? !wasDone : wasDone;
        if (flipsNow) willFlip = !wasDone; // true iff this tap is completing the habit
        if (doneAfter) requiredDoneAfter++;
      }
      const completesDay =
        requiredCount > 0 &&
        willFlip &&
        requiredDoneAfter === requiredCount;
      haptic(completesDay ? "success" : "impact");

      try {
        await toggleTask({
          habitDefinitionId,
          challengeId,
          userId,
          dayNumber,
          date,
          userTimezone,
        });
      } catch {
        toast.error("Failed to update");
      }
    },
    [toggleTask, challengeId, userId, dayNumber, date, userTimezone, guardEdit]
  );

  const handleUpdateCounter = useCallback(
    async (
      habitDefinitionId: Id<"habitDefinitions">,
      currentValue: number,
      increment: number
    ) => {
      if (!guardEdit()) return;
      haptic("selection");
      const nextValue = Math.max(0, currentValue + increment);
      const newValue = Math.round((nextValue + Number.EPSILON) * 1000) / 1000;
      try {
        await updateCounter({
          habitDefinitionId,
          challengeId,
          userId,
          dayNumber,
          date,
          value: newValue,
          userTimezone,
        });
      } catch {
        toast.error("Failed to update");
      }
    },
    [updateCounter, challengeId, userId, dayNumber, date, userTimezone, guardEdit]
  );

  // Compute totals
  const totalItems = habitDefs?.length ?? 0;
  const totalDone =
    habitDefs?.filter((h) => {
      const entry = entryMap.get(h._id);
      return entry?.completed;
    }).length ?? 0;
  const requiredItems =
    habitDefs?.filter((h) => h.isHard).length ?? 0;
  const requiredDone =
    habitDefs?.filter((h) => {
      if (!h.isHard) return false;
      const entry = entryMap.get(h._id);
      return entry?.completed;
    }).length ?? 0;

  return {
    habitDefs,
    entries,
    entryMap,
    totalItems,
    totalDone,
    requiredItems,
    requiredDone,
    handleToggleTask,
    handleUpdateCounter,
  };
}
