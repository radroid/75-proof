"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

interface StartChallengeModalProps {
  onClose: () => void;
}

export function StartChallengeModal({ onClose }: StartChallengeModalProps) {
  const user = useQuery(api.users.getCurrentUser);
  const startChallenge = useMutation(api.challenges.startChallenge);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [visibility, setVisibility] = useState<"private" | "friends" | "public">(
    "friends"
  );
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    if (!user) return;

    setIsStarting(true);
    setError(null);

    try {
      await startChallenge({
        userId: user._id,
        startDate,
        visibility,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start challenge");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Start 75 HARD
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Are you ready to commit to 75 days of mental toughness?
        </p>

        {/* Rules reminder */}
        <div className="mt-4 rounded-lg bg-zinc-50 p-4 dark:bg-zinc-800">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
            Daily Requirements:
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            <li>✓ Two 45-minute workouts (one must be outdoor)</li>
            <li>✓ Follow a diet (no cheat meals)</li>
            <li>✓ No alcohol</li>
            <li>✓ Drink 1 gallon (128 oz) of water</li>
            <li>✓ Read 10 pages of non-fiction</li>
            <li>✓ Take a progress photo</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
            Miss any requirement? Start over from Day 1.
          </p>
        </div>

        {/* Form */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-800"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Who can see your progress?
            </label>
            <div className="mt-2 space-y-2">
              {[
                { value: "private", label: "Private", desc: "Only you" },
                { value: "friends", label: "Friends", desc: "Your friends can see" },
                { value: "public", label: "Public", desc: "Anyone can see" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex cursor-pointer items-center rounded-lg border p-3 transition-colors ${
                    visibility === option.value
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-400 dark:bg-zinc-800"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value={option.value}
                    checked={visibility === option.value}
                    onChange={(e) =>
                      setVisibility(e.target.value as typeof visibility)
                    }
                    className="sr-only"
                  />
                  <div>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">
                      {option.label}
                    </p>
                    <p className="text-sm text-zinc-500">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleStart}
            disabled={isStarting || !user}
            className="flex-1 rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {isStarting ? "Starting..." : "Start Challenge"}
          </button>
        </div>
      </div>
    </div>
  );
}
