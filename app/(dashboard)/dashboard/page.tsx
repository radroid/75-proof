"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { DailyChecklist } from "@/components/DailyChecklist";
import { StartChallengeModal } from "@/components/StartChallengeModal";

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrentUser);
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Create user in Convex if they don't exist
  useEffect(() => {
    if (user === null && !isCreatingUser) {
      setIsCreatingUser(true);
      createOrGetUser().finally(() => setIsCreatingUser(false));
    }
  }, [user, createOrGetUser, isCreatingUser]);

  // Loading state
  if (user === undefined || isCreatingUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Track your daily progress and stay on top of your 75 HARD challenge.
        </p>
      </div>

      {user?.currentChallengeId ? (
        <ActiveChallenge userId={user._id} challengeId={user.currentChallengeId} />
      ) : (
        <NoActiveChallenge />
      )}
    </div>
  );
}

function ActiveChallenge({
  userId,
  challengeId,
}: {
  userId: string;
  challengeId: string;
}) {
  const challenge = useQuery(api.challenges.getChallenge, {
    challengeId: challengeId as any,
  });

  if (!challenge) {
    return (
      <div className="animate-pulse text-zinc-500">Loading challenge...</div>
    );
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Current Progress
            </p>
            <p className="mt-1 text-4xl font-bold text-zinc-900 dark:text-zinc-50">
              Day {challenge.currentDay}
              <span className="text-lg font-normal text-zinc-400"> / 75</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Started
            </p>
            <p className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {new Date(challenge.startDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${(challenge.currentDay / 75) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            {75 - challenge.currentDay} days remaining
          </p>
        </div>
      </div>

      {/* Daily checklist */}
      <DailyChecklist
        challengeId={challengeId as any}
        userId={userId as any}
        dayNumber={challenge.currentDay}
        date={today}
      />
    </div>
  );
}

function NoActiveChallenge() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="rounded-xl border-2 border-dashed border-zinc-300 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
        <div className="text-6xl mb-4">🎯</div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Ready to Start?
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Begin your 75 HARD journey today. Track your workouts, water intake,
          reading, and more.
        </p>
        <button
          onClick={() => setShowModal(true)}
          className="mt-6 rounded-full bg-zinc-900 px-8 py-3 text-white font-medium transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Start 75 HARD Challenge
        </button>
      </div>

      {showModal && <StartChallengeModal onClose={() => setShowModal(false)} />}
    </>
  );
}
