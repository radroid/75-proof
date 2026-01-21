"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ProgressPage() {
  const user = useQuery(api.users.getCurrentUser);
  const challenge = useQuery(
    api.challenges.getChallenge,
    user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip"
  );
  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip"
  );

  if (!user || !challenge) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Progress
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Start a challenge to see your progress here.
        </p>
      </div>
    );
  }

  const completedDays = logs?.filter((log) => log.allRequirementsMet).length ?? 0;
  const totalWorkouts = logs?.reduce((acc, log) => {
    let count = 0;
    if (log.workout1) count++;
    if (log.workout2) count++;
    return acc + count;
  }, 0) ?? 0;
  const totalWater = logs?.reduce((acc, log) => acc + log.waterIntakeOz, 0) ?? 0;
  const totalReading = logs?.reduce((acc, log) => acc + log.readingMinutes, 0) ?? 0;

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Progress
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Track your journey through 75 HARD.
      </p>

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Days Completed"
          value={completedDays}
          suffix="/ 75"
          icon="📅"
        />
        <StatCard
          label="Total Workouts"
          value={totalWorkouts}
          icon="🏋️"
        />
        <StatCard
          label="Water Consumed"
          value={Math.round(totalWater / 128)}
          suffix="gallons"
          icon="💧"
        />
        <StatCard
          label="Reading Time"
          value={totalReading}
          suffix="min"
          icon="📚"
        />
      </div>

      {/* Calendar view */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          75-Day Calendar
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="grid grid-cols-15 gap-1">
            {Array.from({ length: 75 }, (_, i) => {
              const dayNumber = i + 1;
              const log = logs?.find((l) => l.dayNumber === dayNumber);
              const isComplete = log?.allRequirementsMet;
              const isCurrent = dayNumber === challenge.currentDay;
              const isPast = dayNumber < challenge.currentDay;

              return (
                <div
                  key={dayNumber}
                  className={`aspect-square rounded flex items-center justify-center text-xs font-medium ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : isPast
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800"
                  }`}
                  title={`Day ${dayNumber}${isComplete ? " - Complete" : ""}`}
                >
                  {dayNumber}
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-green-500" />
              <span className="text-zinc-600 dark:text-zinc-400">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-zinc-900 dark:bg-zinc-50" />
              <span className="text-zinc-600 dark:text-zinc-400">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-red-100 dark:bg-red-900/30" />
              <span className="text-zinc-600 dark:text-zinc-400">Missed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        {value}
        {suffix && (
          <span className="text-lg font-normal text-zinc-400 ml-1">
            {suffix}
          </span>
        )}
      </p>
    </div>
  );
}
