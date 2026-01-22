"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Droplets, BookOpen, Dumbbell } from "lucide-react";

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

  if (user === undefined) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!user || !challenge) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-3xl font-bold">Progress</h1>
        <p className="mt-4 text-muted-foreground">
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
      <h1 className="text-3xl font-bold">Progress</h1>
      <p className="mt-2 text-muted-foreground">
        Track your journey through 75 HARD.
      </p>

      {/* Stats grid */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Days Completed"
          value={completedDays}
          suffix="/ 75"
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          label="Total Workouts"
          value={totalWorkouts}
          icon={<Dumbbell className="h-5 w-5 text-orange-500" />}
        />
        <StatCard
          label="Water Consumed"
          value={Math.round(totalWater / 128)}
          suffix="gallons"
          icon={<Droplets className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          label="Reading Time"
          value={totalReading}
          suffix="min"
          icon={<BookOpen className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Calendar view */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">75-Day Calendar</h2>
        <Card>
          <CardContent className="pt-6">
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
                    className={`aspect-square rounded flex items-center justify-center text-xs font-medium transition-colors ${
                      isComplete
                        ? "bg-emerald-500 text-white"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : isPast
                        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-muted text-muted-foreground"
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
                <div className="h-3 w-3 rounded bg-emerald-500" />
                <span className="text-muted-foreground">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary" />
                <span className="text-muted-foreground">Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-100 dark:bg-red-900/30" />
                <span className="text-muted-foreground">Missed</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardDescription>{label}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">
          {value}
          {suffix && (
            <span className="text-lg font-normal text-muted-foreground ml-1">
              {suffix}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}
