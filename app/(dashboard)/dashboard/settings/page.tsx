"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";

export default function SettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateUser);
  const failChallenge = useMutation(api.challenges.failChallenge);
  const challenge = useQuery(
    api.challenges.getChallenge,
    user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip"
  );

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [waterUnit, setWaterUnit] = useState<"oz" | "ml">(
    user?.preferences.waterUnit ?? "oz"
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser({
        displayName,
        preferences: {
          timezone: user?.preferences.timezone ?? "America/New_York",
          waterUnit,
        },
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChallenge = async () => {
    if (!user?.currentChallengeId || !challenge) return;
    await failChallenge({
      challengeId: user.currentChallengeId,
      failedOnDay: challenge.currentDay,
    });
    setShowResetConfirm(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
        Settings
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Manage your account and preferences.
      </p>

      {/* Profile section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Profile
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4 mb-6">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-16 h-16",
                },
              }}
            />
            <div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Click to manage your Clerk account
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Preferences section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
          Preferences
        </h2>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Water Unit
              </label>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => setWaterUnit("oz")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    waterUnit === "oz"
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  Ounces (oz)
                </button>
                <button
                  onClick={() => setWaterUnit("ml")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    waterUnit === "ml"
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  Milliliters (ml)
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      {user.currentChallengeId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <h3 className="font-medium text-red-900 dark:text-red-100">
              Reset Challenge
            </h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">
              If you missed a requirement, you need to restart from Day 1. This
              action cannot be undone.
            </p>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
              >
                Reset My Challenge
              </button>
            ) : (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleResetChallenge}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
                >
                  Confirm Reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium dark:border-zinc-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
