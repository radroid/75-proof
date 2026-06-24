"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { DynamicDailyChecklist } from "@/components/DynamicDailyChecklist";
import { DayNavigator } from "@/components/DayNavigator";
import { SwipeableDayView } from "@/components/swipeable-day-view";
import { ChallengeFailedDialog } from "@/components/ChallengeFailedDialog";
import { ReconciliationDialog } from "@/components/ReconciliationDialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChallengeStatus } from "@/hooks/use-challenge-status";
import { useReconciliation } from "@/hooks/use-reconciliation";
import { useGuest } from "@/components/guest-provider";
import { isDayEditable, getDateForDay, effectiveDaysTotal } from "@/lib/day-utils";
import { ChallengeCompletedDialog } from "@/components/ChallengeCompletedDialog";
import {
  useLocalActiveHabitDefinitions,
  useLocalEntriesForDay,
} from "@/lib/local-store/hooks";
import type { Doc } from "@/convex/_generated/dataModel";

// The earned dashboard is the default theme's home surface. It keeps the
// exact data/logic of the other themed dashboards (same hooks, dialogs and
// completion math) and only changes the presentation to the earned identity:
// cream paper, a handwritten date, a big Poppins day number, sky progress,
// and a gold star earned when the day is fully done. All colors come from the
// theme tokens; the gold star is the brand reward currency.
interface ThemedDashboardProps {
  user: Doc<"users">;
  challenge: Doc<"challenges">;
}

const HAND = "'Caveat', 'Poppins', cursive";
const STRUCT = "'Poppins', system-ui, sans-serif";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function handwrittenDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD (local challenge date). Build a stable, locale-free
  // label without touching `Date.now()`.
  const parts = dateStr.split("-").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "today";
  const [y, m, d] = parts;
  // Zeller-free: use UTC Date purely for weekday math on an explicit date.
  const idx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAYS[idx] ?? "today";
}

export function EarnedDashboard({ user, challenge }: ThemedDashboardProps) {
  const { isGuest, demoLifetimeStats } = useGuest();

  const { todayDayNumber, userTimezone, statusResult, recheck } = useChallengeStatus(
    challenge._id,
    challenge.startDate,
  );

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const displayDay = selectedDayNumber ?? todayDayNumber;
  const dateStr = getDateForDay(challenge.startDate, displayDay);
  const isEditable = isGuest
    ? displayDay <= todayDayNumber
    : isDayEditable(displayDay, todayDayNumber);
  const daysTotal = effectiveDaysTotal(challenge); // null = habit-tracker mode
  const isHabitTracker = daysTotal === null;
  const completion = isHabitTracker
    ? 100
    : Math.round((todayDayNumber / daysTotal) * 100);
  const segmentDays = isHabitTracker
    ? Math.max(Math.ceil(Math.max(todayDayNumber + 7, 14) / 15), 1)
    : Math.max(Math.ceil((daysTotal ?? 75) / 15), 1);

  const [showFailedDialog, setShowFailedDialog] = useState(true);
  const [showCompletedDialog, setShowCompletedDialog] = useState(true);
  const hasCompleted = statusResult?.status === "completed";
  const needsReconciliation =
    !isGuest && statusResult?.status === "needs_reconciliation";
  const reconciliation = useReconciliation({
    challengeId: challenge._id,
    missedDays:
      statusResult?.status === "needs_reconciliation"
        ? statusResult.missedDays ?? []
        : [],
    onResolved: recheck,
  });

  const convexLifetimeStats = useQuery(
    api.challenges.getLifetimeStats,
    isGuest ? "skip" : { userId: user._id }
  );
  const effectiveLifetimeStats = isGuest ? demoLifetimeStats : convexLifetimeStats;

  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : { challengeId: challenge._id }
  );
  const effectiveLogs = logs;

  const convexHabitDefs = useQuery(
    api.habitDefinitions.getActiveHabitDefinitions,
    isGuest ? "skip" : { challengeId: challenge._id }
  );
  const localHabitDefs = useLocalActiveHabitDefinitions(
    isGuest ? (challenge._id as string) : undefined,
  );
  const habitDefs = isGuest ? localHabitDefs : convexHabitDefs;
  const convexHabitEntries = useQuery(
    api.habitEntries.getEntriesForDay,
    isGuest || !habitDefs || habitDefs.length === 0
      ? "skip"
      : { challengeId: challenge._id, dayNumber: displayDay }
  );
  const localHabitEntries = useLocalEntriesForDay(
    isGuest ? (challenge._id as string) : undefined,
    displayDay,
  );
  const habitEntries = isGuest ? localHabitEntries : convexHabitEntries;
  const isNewSystem = isGuest || (habitDefs?.length ?? 0) > 0;

  const selectedLog = effectiveLogs?.find((l: any) => l.dayNumber === displayDay);
  const legacyTotalDone = selectedLog ? [
    !!selectedLog.workout1 && selectedLog.workout1.durationMinutes >= 45,
    !!selectedLog.workout2 && selectedLog.workout2.durationMinutes >= 45,
    selectedLog.outdoorWorkoutCompleted,
    (selectedLog.waterIntakeOz ?? 0) >= 128,
    selectedLog.dietFollowed,
    selectedLog.noAlcohol,
    (selectedLog.readingMinutes ?? 0) >= 20,
    !!selectedLog.progressPhotoId,
  ].filter(Boolean).length : 0;

  const newSystemEntryMap = new Map((habitEntries ?? []).map((e: any) => [e.habitDefinitionId, e]));
  const newTotalDone = isNewSystem ? (habitDefs?.filter((h: any) => newSystemEntryMap.get(h._id)?.completed).length ?? 0) : 0;
  const newTotalItems = isNewSystem ? (habitDefs?.length ?? 0) : 8;

  const totalDone = isNewSystem ? newTotalDone : legacyTotalDone;
  const totalItems = isNewSystem ? newTotalItems : 8;
  const allDone = totalItems > 0 && totalDone === totalItems;

  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (completion / 100) * circumference;

  const weekdayLabel = displayDay === todayDayNumber ? "today" : handwrittenDate(dateStr);

  return (
    <div className="max-w-5xl mx-auto">
      {!isGuest && statusResult?.status === "failed" && (
        <ChallengeFailedDialog
          open={showFailedDialog}
          failedOnDay={statusResult.failedOnDay!}
          streakReached={Math.max((statusResult.failedOnDay ?? 1) - 1, 0)}
          attemptNumber={(effectiveLifetimeStats?.attemptNumber ?? 1) + 1}
          onStartNew={() => {
            setShowFailedDialog(false);
            window.location.reload();
          }}
          onDismiss={() => setShowFailedDialog(false)}
        />
      )}

      {needsReconciliation && statusResult?.status === "needs_reconciliation" && (
        <ReconciliationDialog
          open
          missedDays={statusResult.missedDays ?? []}
          usesNewSystem={statusResult.usesNewSystem ?? false}
          hasSoftHabits={statusResult.hasSoftHabits ?? false}
          isSubmitting={reconciliation.isSubmitting}
          onReset={reconciliation.onReset}
          onBackfillHard={reconciliation.onBackfillHard}
          onBackfillAll={reconciliation.onBackfillAll}
        />
      )}

      {hasCompleted && !isGuest && (
        <ChallengeCompletedDialog
          open={showCompletedDialog}
          challengeId={challenge._id}
          daysTotal={challenge.daysTotal ?? 75}
          onDismiss={() => setShowCompletedDialog(false)}
        />
      )}

      {/* Page header — handwritten weekday + big day number, like a notebook */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative mb-8 md:mb-12"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          {/* Left: date + day number */}
          <div>
            <p
              className="leading-none mb-1 text-primary"
              style={{ fontFamily: HAND, fontSize: "clamp(26px, 6vw, 38px)" }}
            >
              {weekdayLabel}
            </p>
            <div className="flex items-end gap-3">
              <h1
                className="select-none leading-[0.85] tracking-tight text-foreground"
                style={{
                  fontFamily: STRUCT,
                  fontWeight: 800,
                  fontSize: "clamp(72px, 18vw, 150px)",
                }}
              >
                {displayDay}
              </h1>
              <p className="pb-2 md:pb-4 text-2xl sm:text-3xl font-light text-muted-foreground/50" style={{ fontFamily: STRUCT }}>
                {isHabitTracker ? (
                  <>
                    <span className="sr-only">habit tracker</span>★
                  </>
                ) : (
                  <>
                    <span className="sr-only">of </span>/{daysTotal}
                  </>
                )}
              </p>
            </div>

            {/* Segmented progress — sky ink marks across the page */}
            <div className="mt-5 max-w-md">
              <div
                className="flex gap-[3px] sm:gap-1"
                role="progressbar"
                aria-valuenow={todayDayNumber}
                aria-valuemin={0}
                aria-valuemax={isHabitTracker ? todayDayNumber : (daysTotal ?? 75)}
                aria-label={
                  isHabitTracker
                    ? `Day ${todayDayNumber} (habit tracker)`
                    : `Day ${todayDayNumber} of ${daysTotal}`
                }
              >
                {Array.from({ length: 15 }).map((_, i) => {
                  const filled = todayDayNumber >= (i + 1) * segmentDays;
                  const partial = !filled && todayDayNumber > i * segmentDays;
                  return (
                    <div key={i} className="flex-1 h-2.5 sm:h-3 rounded-[3px] overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-[3px] bg-primary"
                        style={{
                          width: filled ? "100%" : partial ? `${((todayDayNumber % segmentDays) / segmentDays) * 100}%` : "0%",
                          opacity: filled ? 1 : partial ? 0.7 : 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[11px] uppercase tracking-wider text-muted-foreground" style={{ fontFamily: STRUCT }}>
                <span>Start</span>
                <span>Halfway</span>
                <span>Finish</span>
              </div>
            </div>
          </div>

          {/* Right: progress ring with star when the day is fully earned */}
          <div className="hidden md:flex flex-col items-center pt-1">
            <div className="relative">
              <svg width="132" height="132" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" className="stroke-muted" strokeWidth="7" />
                <motion.circle
                  cx="60" cy="60" r="54"
                  fill="none"
                  className="stroke-primary"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: progressOffset }}
                  transition={{ duration: 1.1, delay: 0.25 }}
                  transform="rotate(-90 60 60)"
                />
                <text
                  x="60" y="56"
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{ fontFamily: STRUCT, fontSize: "30px", fontWeight: 800 }}
                >
                  {completion}%
                </text>
                <text
                  x="60" y="74"
                  textAnchor="middle"
                  className="fill-muted-foreground"
                  style={{ fontFamily: STRUCT, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}
                >
                  {isHabitTracker ? "showing up" : "of the way"}
                </text>
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Star divider */}
      <div className="flex items-center gap-3 mb-6 md:mb-8" aria-hidden="true">
        <div className="h-px flex-1 bg-border" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/star.svg" alt="" width={22} height={22} style={{ opacity: allDone ? 1 : 0.35 }} />
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Day navigator */}
      <div className="mb-6 md:mb-8">
        <DayNavigator
          selectedDayNumber={displayDay}
          todayDayNumber={todayDayNumber}
          startDate={challenge.startDate}
          onDayChange={setSelectedDayNumber}
        />
      </div>

      {/* Today's progress */}
      <div className="text-center mb-8 md:mb-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-1" style={{ fontFamily: STRUCT }}>
          Today&apos;s habits
        </p>
        <p className="text-2xl md:text-3xl font-bold tabular-nums inline-flex items-center gap-2" style={{ fontFamily: STRUCT, fontWeight: 800 }}>
          <span className="text-foreground">{totalDone}</span>
          <span className="text-muted-foreground/50">/{totalItems}</span>
          {allDone && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/star.svg" alt="all done — star earned" width={26} height={26} />
          )}
        </p>
        <p className="mt-1 text-muted-foreground" style={{ fontFamily: HAND, fontSize: 20 }}>
          {allDone
            ? "showed up. star earned."
            : totalItems - totalDone === 1
              ? "one more to go"
              : `${Math.max(totalItems - totalDone, 0)} to go`}
        </p>
        <div className="mt-3 h-1 rounded-full bg-muted max-w-[220px] mx-auto overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalItems > 0 ? (totalDone / totalItems) * 100 : 0}%` }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      {/* Daily Checklist */}
      <SwipeableDayView
        displayDay={displayDay}
        todayDayNumber={todayDayNumber}
        onDayChange={setSelectedDayNumber}
      >
        {isNewSystem ? (
          <DynamicDailyChecklist
            challengeId={challenge._id}
            userId={user._id}
            dayNumber={displayDay}
            date={dateStr}
            isEditable={isEditable}
            userTimezone={userTimezone}
          />
        ) : (
          <DailyChecklist
            challengeId={challenge._id}
            userId={user._id}
            dayNumber={displayDay}
            date={dateStr}
            isEditable={isEditable}
            userTimezone={userTimezone}
          />
        )}
      </SwipeableDayView>
    </div>
  );
}
