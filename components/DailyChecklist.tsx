"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface DailyChecklistProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
}

export function DailyChecklist({
  challengeId,
  userId,
  dayNumber,
  date,
}: DailyChecklistProps) {
  const dailyLog = useQuery(api.dailyLogs.getDailyLog, {
    challengeId,
    dayNumber,
  });
  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const updateWater = useMutation(api.dailyLogs.updateWaterIntake);

  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (
    field: "dietFollowed" | "noAlcohol",
    value: boolean
  ) => {
    setIsUpdating(true);
    try {
      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        [field]: value,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleWaterChange = async (amount: number) => {
    const newAmount = Math.max(0, (dailyLog?.waterIntakeOz ?? 0) + amount);
    await updateWater({
      challengeId,
      userId,
      dayNumber,
      date,
      waterIntakeOz: newAmount,
    });
  };

  const handleReadingChange = async (minutes: number) => {
    const newMinutes = Math.max(0, (dailyLog?.readingMinutes ?? 0) + minutes);
    await updateLog({
      challengeId,
      userId,
      dayNumber,
      date,
      readingMinutes: newMinutes,
    });
  };

  const waterProgress = Math.min(100, ((dailyLog?.waterIntakeOz ?? 0) / 128) * 100);
  const readingProgress = Math.min(100, ((dailyLog?.readingMinutes ?? 0) / 20) * 100);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Today&apos;s Checklist
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Workout 1 */}
        <ChecklistCard
          title="Workout 1"
          icon="🏋️"
          completed={!!dailyLog?.workout1 && dailyLog.workout1.durationMinutes >= 45}
          subtitle={dailyLog?.workout1 ? `${dailyLog.workout1.name} - ${dailyLog.workout1.durationMinutes} min` : "45 minutes required"}
        >
          <WorkoutButton
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            workoutNumber={1}
            existingWorkout={dailyLog?.workout1}
          />
        </ChecklistCard>

        {/* Workout 2 */}
        <ChecklistCard
          title="Workout 2"
          icon="🏃"
          completed={!!dailyLog?.workout2 && dailyLog.workout2.durationMinutes >= 45}
          subtitle={dailyLog?.workout2 ? `${dailyLog.workout2.name} - ${dailyLog.workout2.durationMinutes} min` : "45 minutes required"}
        >
          <WorkoutButton
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            workoutNumber={2}
            existingWorkout={dailyLog?.workout2}
          />
        </ChecklistCard>

        {/* Outdoor Workout */}
        <ChecklistCard
          title="Outdoor Workout"
          icon="🌳"
          completed={dailyLog?.outdoorWorkoutCompleted ?? false}
          subtitle="One workout must be outside"
        >
          <p className="text-sm text-zinc-500">
            {dailyLog?.outdoorWorkoutCompleted
              ? "Completed!"
              : "Mark a workout as outdoor"}
          </p>
        </ChecklistCard>

        {/* Water Intake */}
        <ChecklistCard
          title="Water Intake"
          icon="💧"
          completed={(dailyLog?.waterIntakeOz ?? 0) >= 128}
          subtitle={`${dailyLog?.waterIntakeOz ?? 0} / 128 oz`}
        >
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${waterProgress}%` }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleWaterChange(8)}
                className="flex-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                +8 oz
              </button>
              <button
                onClick={() => handleWaterChange(16)}
                className="flex-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                +16 oz
              </button>
              <button
                onClick={() => handleWaterChange(-8)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                -8
              </button>
            </div>
          </div>
        </ChecklistCard>

        {/* Reading */}
        <ChecklistCard
          title="Reading"
          icon="📚"
          completed={(dailyLog?.readingMinutes ?? 0) >= 20}
          subtitle={`${dailyLog?.readingMinutes ?? 0} / 20 min (10 pages)`}
        >
          <div className="space-y-2">
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${readingProgress}%` }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReadingChange(5)}
                className="flex-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                +5 min
              </button>
              <button
                onClick={() => handleReadingChange(10)}
                className="flex-1 rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                +10 min
              </button>
              <button
                onClick={() => handleReadingChange(-5)}
                className="rounded-lg bg-zinc-100 px-3 py-1.5 text-sm font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
              >
                -5
              </button>
            </div>
          </div>
        </ChecklistCard>

        {/* Diet */}
        <ChecklistCard
          title="Follow Diet"
          icon="🥗"
          completed={dailyLog?.dietFollowed ?? false}
          subtitle="Stick to your chosen diet"
        >
          <button
            onClick={() => handleToggle("dietFollowed", !dailyLog?.dietFollowed)}
            disabled={isUpdating}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              dailyLog?.dietFollowed
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {dailyLog?.dietFollowed ? "Completed ✓" : "Mark Complete"}
          </button>
        </ChecklistCard>

        {/* No Alcohol */}
        <ChecklistCard
          title="No Alcohol"
          icon="🚫"
          completed={dailyLog?.noAlcohol ?? false}
          subtitle="Stay alcohol-free"
        >
          <button
            onClick={() => handleToggle("noAlcohol", !dailyLog?.noAlcohol)}
            disabled={isUpdating}
            className={`w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              dailyLog?.noAlcohol
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {dailyLog?.noAlcohol ? "Completed ✓" : "Mark Complete"}
          </button>
        </ChecklistCard>

        {/* Progress Photo */}
        <ChecklistCard
          title="Progress Photo"
          icon="📸"
          completed={!!dailyLog?.progressPhotoId}
          subtitle="Take your daily photo"
        >
          <PhotoUpload
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            hasPhoto={!!dailyLog?.progressPhotoId}
          />
        </ChecklistCard>
      </div>

      {/* All requirements status */}
      {dailyLog?.allRequirementsMet && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-6 text-center dark:bg-green-900/20 dark:border-green-800">
          <p className="text-2xl mb-2">🎉</p>
          <p className="text-lg font-semibold text-green-700 dark:text-green-400">
            All requirements completed for today!
          </p>
        </div>
      )}
    </div>
  );
}

function ChecklistCard({
  title,
  icon,
  completed,
  subtitle,
  children,
}: {
  title: string;
  icon: string;
  completed: boolean;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        completed
          ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <div>
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
              {title}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          </div>
        </div>
        {completed && (
          <span className="text-green-500 text-xl">✓</span>
        )}
      </div>
      {children}
    </div>
  );
}

function WorkoutButton({
  challengeId,
  userId,
  dayNumber,
  date,
  workoutNumber,
  existingWorkout,
}: {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  workoutNumber: 1 | 2;
  existingWorkout?: {
    type: string;
    name: string;
    durationMinutes: number;
    isOutdoor: boolean;
  };
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(existingWorkout?.name ?? "");
  const [duration, setDuration] = useState(existingWorkout?.durationMinutes ?? 45);
  const [isOutdoor, setIsOutdoor] = useState(existingWorkout?.isOutdoor ?? false);
  const [type, setType] = useState<"strength" | "cardio" | "yoga" | "sports" | "other">(
    (existingWorkout?.type as any) ?? "strength"
  );

  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const workoutData = {
        type,
        name: name || `Workout ${workoutNumber}`,
        durationMinutes: duration,
        isOutdoor,
      };

      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        ...(workoutNumber === 1 ? { workout1: workoutData } : { workout2: workoutData }),
      });
      setShowForm(false);
    } finally {
      setIsSaving(false);
    }
  };

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="w-full rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        {existingWorkout ? "Edit Workout" : "Log Workout"}
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Workout name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
      />
      <div className="flex gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as any)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        >
          <option value="strength">Strength</option>
          <option value="cardio">Cardio</option>
          <option value="yoga">Yoga</option>
          <option value="sports">Sports</option>
          <option value="other">Other</option>
        </select>
        <input
          type="number"
          value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          className="w-20 rounded-lg border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
          min={1}
        />
        <span className="flex items-center text-sm text-zinc-500">min</span>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isOutdoor}
          onChange={(e) => setIsOutdoor(e.target.checked)}
          className="rounded"
        />
        <span className="text-zinc-700 dark:text-zinc-300">Outdoor workout</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PhotoUpload({
  challengeId,
  userId,
  dayNumber,
  date,
  hasPhoto,
}: {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  hasPhoto: boolean;
}) {
  const generateUploadUrl = useMutation(api.dailyLogs.generateUploadUrl);
  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
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
        progressPhotoId: storageId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <label className={`flex w-full cursor-pointer items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      hasPhoto
        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
        : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
    }`}>
      <input
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
      />
      {isUploading ? "Uploading..." : hasPhoto ? "Photo Uploaded ✓" : "Upload Photo"}
    </label>
  );
}
