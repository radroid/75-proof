"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function HistoryPage() {
  const user = useQuery(api.users.getCurrentUser);
  const challenges = useQuery(
    api.challenges.getUserChallenges,
    user ? { userId: user._id } : "skip"
  );

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Challenge History
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        View your past 75 HARD attempts.
      </p>

      <div className="mt-8 space-y-4">
        {challenges?.length === 0 && (
          <p className="text-zinc-500 dark:text-zinc-400">
            No challenge history yet. Start your first challenge!
          </p>
        )}

        {challenges?.map((challenge) => (
          <div
            key={challenge._id}
            className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      challenge.status === "completed"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : challenge.status === "active"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {challenge.status === "completed"
                      ? "Completed"
                      : challenge.status === "active"
                      ? "Active"
                      : "Failed"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Started {new Date(challenge.startDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  Day {challenge.currentDay}
                  <span className="text-sm font-normal text-zinc-400"> / 75</span>
                </p>
                {challenge.failedOnDay && (
                  <p className="text-sm text-red-500">
                    Ended on Day {challenge.failedOnDay}
                  </p>
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all ${
                    challenge.status === "completed"
                      ? "bg-green-500"
                      : challenge.status === "active"
                      ? "bg-blue-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${(challenge.currentDay / 75) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
