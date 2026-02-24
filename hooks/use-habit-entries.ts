"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback } from "react";
import { toast } from "sonner";

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
      const newValue = Math.max(0, currentValue + increment);
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

  return {
    habitDefs,
    entries,
    entryMap,
    totalItems,
    totalDone,
    handleToggleTask,
    handleUpdateCounter,
  };
}
