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

// Dashboards are polymorphic — they also render local-mode users — but
// every Convex query call below expects branded `Id<"...">` values, and
// the local objects are structurally compatible (`_id: string` is what
// `Id<X>` collapses to at runtime). Type the props as the Convex `Doc`
// shape; `app/(dashboard)/dashboard/page.tsx` upcasts the local
// `demoUser` / `demoChallenge` objects when it invokes the dashboard
// for guests, and the `useQuery(... isGuest ? "skip" : ...)` pattern
// makes sure no Convex round trip ever fires with a fake id.
interface ThemedDashboardProps {
  user: Doc<"users">;
  challenge: Doc<"challenges">;
}

export function ArcticDashboard({ user, challenge }: ThemedDashboardProps) {
  const { isGuest, demoLifetimeStats } = useGuest();

  const { todayDayNumber, userTimezone, statusResult, recheck } = useChallengeStatus(
    challenge._id,
    challenge.startDate,
  );

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const displayDay = selectedDayNumber ?? todayDayNumber;
  const dateStr = getDateForDay(challenge.startDate, displayDay);
  // Local mode allows editing any day up to today (no reconciliation flow).
  // Convex mode keeps the strict today-only edit window.
  const isEditable = isGuest
    ? displayDay <= todayDayNumber
    : isDayEditable(displayDay, todayDayNumber);
  const daysTotal = effectiveDaysTotal(challenge); // null = habit-tracker mode
  const isHabitTracker = daysTotal === null;
  const completion = isHabitTracker
    ? 100
    : Math.round((todayDayNumber / daysTotal) * 100);
  // For the segmented progress bar, bounded challenges are partitioned into
  // 15 segments; habit trackers use a rolling 15-segment view based on day.
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

  // Legacy `dailyLogs` are Convex-only; local mode never produces them.
  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : { challengeId: challenge._id }
  );
  const effectiveLogs = logs;

  // Detect new habit system. Convex source for signed-in; local store for
  // local-mode users (which always use the new system).
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

  // Compute totals based on system
  const newSystemEntryMap = new Map((habitEntries ?? []).map((e: any) => [e.habitDefinitionId, e]));
  const newTotalDone = isNewSystem ? (habitDefs?.filter((h: any) => newSystemEntryMap.get(h._id)?.completed).length ?? 0) : 0;
  const newTotalItems = isNewSystem ? (habitDefs?.length ?? 0) : 8;

  const totalDone = isNewSystem ? newTotalDone : legacyTotalDone;
  const totalItems = isNewSystem ? newTotalItems : 8;

  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (completion / 100) * circumference;

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

      {/* Hero section — day number with blue backdrop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-8 md:mb-16 overflow-hidden"
      >
        {/* Giant faint background number */}
        <div
          aria-hidden="true"
          className="absolute -top-4 -left-1 md:-top-8 md:-left-4 select-none pointer-events-none text-primary opacity-[0.06]"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "clamp(150px, 42vw, 280px)",
            fontWeight: 700,
            lineHeight: 0.85,
          }}
        >
          {displayDay}
        </div>

        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-12">
          {/* Left: day number + progress */}
          <div className="flex-1">
            <div className="flex items-end gap-3 md:gap-4">
              <h1
                className="select-none text-[96px] sm:text-[120px] md:text-[180px] font-bold leading-[0.85] tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {displayDay}
              </h1>
              <div className="pb-3 md:pb-6">
                <p className="select-none text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground/40">
                  {isHabitTracker ? (
                    <>
                      <span className="sr-only">habit tracker</span>∞
                    </>
                  ) : (
                    <>
                      <span className="sr-only">of </span>/{daysTotal}
                    </>
                  )}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {displayDay === todayDayNumber ? "Today" : `Day ${displayDay}`}
            </p>

            {/* Segmented progress bar */}
            <div className="mt-5 md:mt-8 max-w-md">
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
                    <div key={i} className="flex-1 h-2.5 sm:h-3 rounded-sm overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-sm bg-primary"
                        style={{
                          width: filled ? "100%" : partial ? `${((todayDayNumber % segmentDays) / segmentDays) * 100}%` : "0%",
                          opacity: filled ? 1 : partial ? 0.7 : 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                <span>Start</span>
                <span>Halfway</span>
                <span>Finish</span>
              </div>
            </div>

          </div>

          {/* Right: SVG progress ring */}
          <div className="hidden md:flex flex-col items-center pt-4">
            <svg width="140" height="140" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" className="stroke-muted" strokeWidth="6" />
              <motion.circle
                cx="60" cy="60" r="54"
                fill="none"
                className="stroke-primary"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 1.2, delay: 0.3 }}
                transform="rotate(-90 60 60)"
              />
              <text
                x="60" y="55"
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontFamily: "var(--font-heading)", fontSize: "28px", fontWeight: 700 }}
              >
                {completion}%
              </text>
              <text
                x="60" y="72"
                textAnchor="middle"
                className="fill-muted-foreground"
                style={{ fontFamily: "var(--font-body)", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em" }}
              >
                Complete
              </text>
            </svg>
          </div>
        </div>
      </motion.div>

      {/* Geometric divider */}
      <div className="flex items-center gap-3 mb-6 md:mb-8">
        <div className="h-px flex-1 bg-border" />
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rotate-45 bg-primary" />
          <div className="w-2 h-2 rotate-45 bg-primary/60" />
          <div className="w-2 h-2 rotate-45 bg-primary/30" />
        </div>
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

      {/* Today's progress — centered */}
      <div className="text-center mb-8 md:mb-12">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
          Today&apos;s habits
        </p>
        <p className="text-xl md:text-2xl font-semibold tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="text-foreground">{totalDone}</span>
          <span className="text-muted-foreground/50">/{totalItems}</span>
        </p>
        <div className="mt-3 h-1 rounded-full bg-muted max-w-[220px] mx-auto overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${totalItems > 0 ? (totalDone / totalItems) * 100 : 0}%` }}
            transition={{ duration: 0.8, delay: 0.5 }}
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
