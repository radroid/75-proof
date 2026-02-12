"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  getTodayInTimezone,
  computeDayNumber,
  getUserTimezone,
} from "@/lib/day-utils";

interface ChallengeStatusResult {
  status: string;
  failedOnDay?: number;
}

/**
 * Hook that computes todayDayNumber and lazily checks challenge status on mount.
 * Returns the current day info and the result of the server-side status check.
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
  };
}
