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
import { useGuest } from "@/components/guest-provider";
import { syncChallengeStatus as localSync } from "@/lib/local-store/mutations";
import { useLocalChallenge } from "@/lib/local-store/hooks";

export type ChallengeStatusResult = FunctionReturnType<
  typeof api.challenges.checkChallengeStatus
>;

/**
 * Lazily checks challenge status on mount. In Convex mode, runs the
 * `checkChallengeStatus` mutation (handles auto-fail, reconciliation,
 * completion). In local mode, runs the local equivalent which advances
 * `currentDay` and emits a "completed" status when the bounded challenge
 * has been satisfied — but never auto-fails.
 */
export function useChallengeStatus(
  challengeId: Id<"challenges"> | string | undefined,
  startDate: string | undefined,
) {
  const { isGuest } = useGuest();
  const userTimezone = getUserTimezone();
  const todayStr = getTodayInTimezone(userTimezone);
  const todayDayNumber = startDate ? computeDayNumber(startDate, todayStr) : 1;

  const checkStatus = useMutation(api.challenges.checkChallengeStatus);
  const localChallenge = useLocalChallenge(
    isGuest ? (challengeId as string | undefined) : undefined,
  );
  const [statusResult, setStatusResult] = useState<ChallengeStatusResult | null>(
    null,
  );
  const [isCheckComplete, setIsCheckComplete] = useState(false);
  // Track which challengeId we last synced. Resetting on id change handles
  // the post-restart case where a Convex/local user gets a brand new
  // challenge document and the prior status would otherwise stay stuck.
  const lastCheckedRef = useRef<string | undefined>(undefined);

  const recheck = useCallback(async () => {
    if (!challengeId) return;
    if (isGuest) {
      localSync({ challengeId: challengeId as string, userTimezone });
      return;
    }
    try {
      const result = await checkStatus({
        challengeId: challengeId as Id<"challenges">,
        userTimezone,
      });
      setStatusResult(result);
    } catch (err) {
      console.warn("useChallengeStatus.recheck failed", err);
    }
  }, [challengeId, userTimezone, checkStatus, isGuest]);

  useEffect(() => {
    if (!challengeId) return;
    if (lastCheckedRef.current === (challengeId as string)) return;
    lastCheckedRef.current = challengeId as string;
    // Clear the previous challenge's result before re-checking so a
    // restarted challenge doesn't briefly inherit the prior `"failed"` /
    // `"completed"` modal state. `isCheckComplete` is also reset so any
    // "is the check still pending?" gate doesn't render stale dashboards.
    setStatusResult(null);
    setIsCheckComplete(false);

    if (isGuest) {
      localSync({ challengeId: challengeId as string, userTimezone });
      setIsCheckComplete(true);
      return;
    }

    checkStatus({
      challengeId: challengeId as Id<"challenges">,
      userTimezone,
    })
      .then((result) => {
        setStatusResult(result);
        setIsCheckComplete(true);
      })
      .catch(() => {
        setIsCheckComplete(true);
      });
  }, [challengeId, userTimezone, checkStatus, isGuest]);

  // Synthesize a status for local mode from the live store. While the
  // store is still hydrating (`localChallenge === null/undefined`), we
  // return null so the dashboards don't render `hasCompleted = true` or
  // surface a misleading "active" before data is available.
  let localStatus: ChallengeStatusResult | null = null;
  if (isGuest) {
    if (localChallenge) {
      localStatus =
        localChallenge.status === "completed"
          ? ({ status: "completed" } as ChallengeStatusResult)
          : ({ status: "active" } as ChallengeStatusResult);
    }
  }

  return {
    todayDayNumber,
    todayStr,
    userTimezone,
    statusResult: isGuest ? localStatus : statusResult,
    isCheckComplete,
    recheck,
  };
}
