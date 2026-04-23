"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getTodayInTimezone,
  computeDayNumber,
  getUserTimezone,
} from "@/lib/day-utils";

export type ChallengeStatusResult = FunctionReturnType<
  typeof api.challenges.checkChallengeStatus
>;

/**
 * Hook that computes todayDayNumber and lazily checks challenge status on mount.
 * Returns the current day info, the result of the server-side status check,
 * and a `recheck` callback the reconciliation flow uses to refresh state after
 * a backfill/reset without a full page reload.
 */
export function useChallengeStatus(
  challengeId: Id<"challenges"> | undefined,
  startDate: string | undefined
) {
  const userTimezone = getUserTimezone();
  const todayStr = getTodayInTimezone(userTimezone);
  const todayDayNumber = startDate ? computeDayNumber(startDate, todayStr) : 1;

  const checkStatus = useMutation(api.challenges.checkChallengeStatus);
  const [statusResult, setStatusResult] = useState<ChallengeStatusResult | null>(null);
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  const hasChecked = useRef(false);

  const recheck = useCallback(async () => {
    if (!challengeId) return;
    try {
      const result = await checkStatus({ challengeId, userTimezone });
      setStatusResult(result);
    } catch {
      // Swallow — retained statusResult is still the best-available truth.
    }
  }, [challengeId, userTimezone, checkStatus]);

  useEffect(() => {
    if (!challengeId || hasChecked.current) return;
    hasChecked.current = true;

    checkStatus({ challengeId, userTimezone })
      .then((result) => {
        setStatusResult(result);
        setIsCheckComplete(true);
      })
      .catch(() => {
        setIsCheckComplete(true);
      });
  }, [challengeId, userTimezone, checkStatus]);

  return {
    todayDayNumber,
    todayStr,
    userTimezone,
    statusResult,
    isCheckComplete,
    recheck,
  };
}
