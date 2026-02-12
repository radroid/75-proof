"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useRef } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useConfetti } from "@/components/ui/confetti";
import { toast } from "sonner";

interface WorkoutData {
  type: "strength" | "cardio" | "yoga" | "sports" | "other";
  name: string;
  durationMinutes: number;
  isOutdoor: boolean;
}

export function useDailyChecklist(
  challengeId: Id<"challenges">,
  userId: Id<"users">,
  dayNumber: number,
  date: string,
  options?: {
    isEditable?: boolean;
    userTimezone?: string;
  }
) {
  const isEditable = options?.isEditable ?? true;
  const userTimezone = options?.userTimezone;

  const dailyLog = useQuery(api.dailyLogs.getDailyLog, {
    challengeId,
    dayNumber,
  });
  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const updateWater = useMutation(api.dailyLogs.updateWaterIntake);
  const generateUploadUrl = useMutation(api.dailyLogs.generateUploadUrl);
  const { isActive: confettiActive, trigger: triggerConfetti } = useConfetti();
  const prevAllMetRef = useRef(false);

  // Trigger confetti when all requirements are met for the first time
  useEffect(() => {
    if (dailyLog?.allRequirementsMet && !prevAllMetRef.current) {
      triggerConfetti();
    }
    prevAllMetRef.current = dailyLog?.allRequirementsMet ?? false;
  }, [dailyLog?.allRequirementsMet, triggerConfetti]);

  // Guard: if not editable, warn and return early
  const guardEdit = (): boolean => {
    if (!isEditable) {
      toast.error("This day is locked and can no longer be edited.");
      return false;
    }
    return true;
  };

  // Toggle boolean fields
  const toggle = async (field: "dietFollowed" | "noAlcohol", value: boolean) => {
    if (!guardEdit()) return;
    try {
      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        userTimezone,
        [field]: value,
      });
      toast.success(value ? "Marked as complete!" : "Unmarked");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      toast.error(msg.includes("EDIT_WINDOW_CLOSED") ? "This day is locked." : msg);
    }
  };

  // Add/subtract water
  const addWater = async (amount: number) => {
    if (!guardEdit()) return;
    const newAmount = Math.max(0, (dailyLog?.waterIntakeOz ?? 0) + amount);
    try {
      await updateWater({
        challengeId,
        userId,
        dayNumber,
        date,
        waterIntakeOz: newAmount,
        userTimezone,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      toast.error(msg.includes("EDIT_WINDOW_CLOSED") ? "This day is locked." : msg);
    }
  };

  // Add/subtract reading
  const addReading = async (minutes: number) => {
    if (!guardEdit()) return;
    const newMinutes = Math.max(0, (dailyLog?.readingMinutes ?? 0) + minutes);
    try {
      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        userTimezone,
        readingMinutes: newMinutes,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to update";
      toast.error(msg.includes("EDIT_WINDOW_CLOSED") ? "This day is locked." : msg);
    }
  };

  // Save workout
  const saveWorkout = async (workoutNumber: 1 | 2, data: WorkoutData) => {
    if (!guardEdit()) return;
    try {
      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        userTimezone,
        ...(workoutNumber === 1 ? { workout1: data } : { workout2: data }),
      });
      toast.success("Workout logged!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save workout";
      toast.error(msg.includes("EDIT_WINDOW_CLOSED") ? "This day is locked." : msg);
    }
  };

  // Upload photo
  const uploadPhoto = async (file: File) => {
    if (!guardEdit()) return;
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        userTimezone,
        progressPhotoId: storageId,
      });
      toast.success("Photo uploaded!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to upload photo";
      toast.error(msg.includes("EDIT_WINDOW_CLOSED") ? "This day is locked." : msg);
    }
  };

  // Computed states
  const workout1Done = !!dailyLog?.workout1 && dailyLog.workout1.durationMinutes >= 45;
  const workout2Done = !!dailyLog?.workout2 && dailyLog.workout2.durationMinutes >= 45;
  const outdoorDone = dailyLog?.outdoorWorkoutCompleted ?? false;
  const waterOz = dailyLog?.waterIntakeOz ?? 0;
  const waterDone = waterOz >= 128;
  const dietDone = dailyLog?.dietFollowed ?? false;
  const alcoholDone = dailyLog?.noAlcohol ?? false;
  const readingMin = dailyLog?.readingMinutes ?? 0;
  const readingDone = readingMin >= 20;
  const photoDone = !!dailyLog?.progressPhotoId;

  const completedCount = [
    workout1Done, workout2Done, outdoorDone,
    waterDone, dietDone, alcoholDone,
    readingDone, photoDone,
  ].filter(Boolean).length;

  const totalCount = 8;
  const allDone = dailyLog?.allRequirementsMet ?? false;

  const waterProgress = Math.min(100, (waterOz / 128) * 100);
  const readingProgress = Math.min(100, (readingMin / 20) * 100);

  return {
    dailyLog,
    isLoading: dailyLog === undefined,

    // Task states
    workout1Done,
    workout2Done,
    outdoorDone,
    waterOz,
    waterDone,
    waterProgress,
    dietDone,
    alcoholDone,
    readingMin,
    readingDone,
    readingProgress,
    photoDone,

    // Aggregate
    completedCount,
    totalCount,
    allDone,

    // Actions
    toggle,
    addWater,
    addReading,
    saveWorkout,
    uploadPhoto,

    // Confetti
    confettiActive,
  };
}
