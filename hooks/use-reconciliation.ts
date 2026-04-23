"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getTodayInTimezone, getUserTimezone } from "@/lib/day-utils";

interface UseReconciliationArgs {
  challengeId: Id<"challenges">;
  missedDays: number[];
}

/**
 * Packages the three reconciliation-dialog actions (backfill HARD, backfill
 * HARD + soft, reset) behind a single `isSubmitting` flag, so every themed
 * dashboard can wire the dialog identically.
 *
 * On success, each handler triggers `window.location.reload()` to re-run
 * `checkChallengeStatus` from a clean slate — avoids any stale query state
 * from the optimistic Convex client.
 */
export function useReconciliation({ challengeId, missedDays }: UseReconciliationArgs) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const reconcile = useMutation(api.challenges.reconcileMissedDays);
  const resetKeepingSetup = useMutation(api.challenges.resetKeepingSetup);

  const userTimezone = getUserTimezone();
  const todayStr = getTodayInTimezone(userTimezone);

  const runBackfill = async (mode: "hard" | "all") => {
    if (isSubmitting || missedDays.length === 0) return;
    setIsSubmitting(true);
    try {
      await reconcile({
        challengeId,
        missedDays,
        mode,
        userTimezone,
      });
      window.location.reload();
    } catch (err) {
      setIsSubmitting(false);
      throw err;
    }
  };

  const onBackfillHard = () => runBackfill("hard");
  const onBackfillAll = () => runBackfill("all");

  const onReset = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Reset uses the first missed day as the "stopped on" marker, matching
      // how the auto-fail path records the fail point.
      const failedOnDay = missedDays[0] ?? 1;
      await resetKeepingSetup({
        challengeId,
        failedOnDay,
        startDate: todayStr,
      });
      window.location.reload();
    } catch (err) {
      setIsSubmitting(false);
      throw err;
    }
  };

  return { isSubmitting, onBackfillHard, onBackfillAll, onReset };
}
