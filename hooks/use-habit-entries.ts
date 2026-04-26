"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { haptic } from "@/lib/haptics";
import { useGuest } from "@/components/guest-provider";
import {
  useLocalActiveHabitDefinitions,
  useLocalEntriesForDay,
} from "@/lib/local-store/hooks";
import {
  toggleTaskEntry as localToggleTask,
  updateCounterEntry as localUpdateCounter,
} from "@/lib/local-store/mutations";

interface UseHabitEntriesArgs {
  challengeId: Id<"challenges"> | string;
  userId: Id<"users"> | string;
  dayNumber: number;
  date: string;
  userTimezone?: string;
  isEditable: boolean;
}

/**
 * Polymorphic data + mutation hook for the day-level habit checklist.
 * Routes to the local store when the visitor is in local mode (`isGuest`),
 * otherwise to Convex. Hook order is stable: both branches' subscriptions
 * are always set up; only one source feeds the return value.
 */
export function useHabitEntries({
  challengeId,
  userId,
  dayNumber,
  date,
  userTimezone,
  isEditable,
}: UseHabitEntriesArgs) {
  const { isGuest } = useGuest();

  const convexHabitDefs = useQuery(
    api.habitDefinitions.getActiveHabitDefinitions,
    isGuest ? "skip" : { challengeId: challengeId as Id<"challenges"> },
  );
  const convexEntries = useQuery(
    api.habitEntries.getEntriesForDay,
    isGuest
      ? "skip"
      : { challengeId: challengeId as Id<"challenges">, dayNumber },
  );
  const convexToggleTask = useMutation(api.habitEntries.toggleTaskEntry);
  const convexUpdateCounter = useMutation(api.habitEntries.updateCounterEntry);

  const localHabitDefs = useLocalActiveHabitDefinitions(
    isGuest ? (challengeId as string) : undefined,
  );
  const localEntries = useLocalEntriesForDay(
    isGuest ? (challengeId as string) : undefined,
    dayNumber,
  );

  const habitDefs = isGuest ? localHabitDefs : convexHabitDefs;
  const entries = isGuest ? localEntries : convexEntries;

  type EntryShape = {
    habitDefinitionId: string;
    completed: boolean;
    value?: number;
  };
  const entryMap = new Map<string, EntryShape>(
    (entries ?? []).map((e: EntryShape) => [e.habitDefinitionId, e]),
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
    async (habitDefinitionId: Id<"habitDefinitions"> | string) => {
      if (!guardEdit()) return;

      // Predict whether this tap completes the last hard habit so the
      // success haptic fires inside the trusted-event window.
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
        if (flipsNow) willFlip = !wasDone;
        if (doneAfter) requiredDoneAfter++;
      }
      const completesDay =
        requiredCount > 0 &&
        willFlip &&
        requiredDoneAfter === requiredCount;
      haptic(completesDay ? "success" : "impact");

      try {
        if (isGuest) {
          localToggleTask({
            habitDefinitionId: habitDefinitionId as string,
            challengeId: challengeId as string,
            dayNumber,
            date,
          });
          return;
        }
        await convexToggleTask({
          habitDefinitionId: habitDefinitionId as Id<"habitDefinitions">,
          challengeId: challengeId as Id<"challenges">,
          userId: userId as Id<"users">,
          dayNumber,
          date,
          userTimezone,
        });
      } catch {
        toast.error("Failed to update");
      }
    },
    [
      isGuest,
      convexToggleTask,
      challengeId,
      userId,
      dayNumber,
      date,
      userTimezone,
      guardEdit,
    ],
  );

  const handleUpdateCounter = useCallback(
    async (
      habitDefinitionId: Id<"habitDefinitions"> | string,
      currentValue: number,
      increment: number,
    ) => {
      if (!guardEdit()) return;
      haptic("selection");
      const nextValue = Math.max(0, currentValue + increment);
      const newValue = Math.round((nextValue + Number.EPSILON) * 1000) / 1000;
      try {
        if (isGuest) {
          localUpdateCounter({
            habitDefinitionId: habitDefinitionId as string,
            challengeId: challengeId as string,
            dayNumber,
            date,
            value: newValue,
          });
          return;
        }
        await convexUpdateCounter({
          habitDefinitionId: habitDefinitionId as Id<"habitDefinitions">,
          challengeId: challengeId as Id<"challenges">,
          userId: userId as Id<"users">,
          dayNumber,
          date,
          value: newValue,
          userTimezone,
        });
      } catch {
        toast.error("Failed to update");
      }
    },
    [
      isGuest,
      convexUpdateCounter,
      challengeId,
      userId,
      dayNumber,
      date,
      userTimezone,
      guardEdit,
    ],
  );

  // Compute totals
  const totalItems = habitDefs?.length ?? 0;
  const totalDone =
    habitDefs?.filter((h) => {
      const entry = entryMap.get(h._id);
      return entry?.completed;
    }).length ?? 0;
  const requiredItems = habitDefs?.filter((h) => h.isHard).length ?? 0;
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
