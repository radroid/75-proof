"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { getTodayInTimezone, getUserTimezone } from "@/lib/day-utils";

interface UseReconciliationArgs {
  challengeId: Id<"challenges">;
  missedDays: number[];
  /**
   * Called after a successful backfill/reset to refresh derived state (e.g.
   * re-run `checkChallengeStatus`). Reactive Convex queries will re-render
   * on their own as the underlying data changes; this is specifically for
   * the mutation-driven status result that won't otherwise recompute.
   */
  onResolved?: () => void | Promise<void>;
}

/**
 * Packages the three reconciliation-dialog actions (backfill HARD, backfill
 * HARD + soft, reset) behind a single `isSubmitting` flag, so every themed
 * dashboard can wire the dialog identically.
 */
export function useReconciliation({
  challengeId,
  missedDays,
  onResolved,
}: UseReconciliationArgs) {
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
      await onResolved?.();
    } finally {
      setIsSubmitting(false);
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
      await onResolved?.();
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, onBackfillHard, onBackfillAll, onReset };
}
