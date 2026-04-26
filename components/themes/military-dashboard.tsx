"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { DynamicDailyChecklist } from "@/components/DynamicDailyChecklist";
import { DayNavigator } from "@/components/DayNavigator";
import { SwipeableDayView } from "@/components/swipeable-day-view";
import { ChallengeFailedDialog } from "@/components/ChallengeFailedDialog";
import { ChallengeCompletedDialog } from "@/components/ChallengeCompletedDialog";
import { ReconciliationDialog } from "@/components/ReconciliationDialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChallengeStatus } from "@/hooks/use-challenge-status";
import { useReconciliation } from "@/hooks/use-reconciliation";
import { useGuest } from "@/components/guest-provider";
import { isDayEditable, getDateForDay, effectiveDaysTotal } from "@/lib/day-utils";
import {
  useLocalActiveHabitDefinitions,
  useLocalEntriesForDay,
} from "@/lib/local-store/hooks";
import type { Doc } from "@/convex/_generated/dataModel";

// See arctic-dashboard.tsx for the rationale: polymorphic prop typed
// as the Convex `Doc` shape; local-mode objects are upcast at the
// call site in `app/(dashboard)/dashboard/page.tsx`.
interface ThemedDashboardProps {
  user: Doc<"users">;
  challenge: Doc<"challenges">;
}

export function MilitaryDashboard({ user, challenge }: ThemedDashboardProps) {
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
  const daysTotal = effectiveDaysTotal(challenge);
  const isHabitTracker = daysTotal === null;
  const completion = isHabitTracker
    ? 100
    : Math.round((todayDayNumber / daysTotal) * 100);
  const segmentTotal = isHabitTracker
    ? Math.max(todayDayNumber + 7, 14)
    : (daysTotal ?? 75);

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

  const today = new Date();
  const hours = today.getHours();
  const minutes = today.getMinutes();
  const seconds = today.getSeconds();
  const missionTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto px-1 sm:px-0">
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

      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(194,178,128,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(194,178,128,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10">
        {/* Top status bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-[10px] md:text-[11px] tracking-[0.24em] md:tracking-[0.3em] uppercase mb-6 md:mb-10 pb-3 md:pb-4 border-b border-border"
        >
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-muted-foreground">CLASSIFIED</span>
            <span className="text-border" aria-hidden="true">|</span>
            <span className="text-foreground">OPERATOR-1</span>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-foreground tabular-nums">MISSION TIME: {missionTime}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse bg-primary" aria-hidden="true" />
              <span className="text-primary">ACTIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Hero: Day counter in stencil */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-7 md:mb-12"
        >
          <p className="text-[11px] md:text-[12px] tracking-[0.4em] uppercase mb-4 text-muted-foreground">
            OPERATION DAY
          </p>
          <div className="flex items-baseline gap-3">
            <h1
              className="text-[76px] md:text-[140px] leading-none text-foreground tabular-nums"
              style={{
                fontFamily: "var(--font-heading)",
                textShadow: "0 0 40px rgba(194,178,128,0.15)",
              }}
            >
              {String(displayDay).padStart(2, "0")}
            </h1>
            <span className="text-2xl md:text-3xl font-light text-border tabular-nums">
              {isHabitTracker ? "/∞" : `/${daysTotal}`}
            </span>
          </div>

          {/* Tactical progress bar */}
          <div
            className="mt-4 md:mt-6 max-w-xl"
            role="progressbar"
            aria-valuenow={todayDayNumber}
            aria-valuemin={0}
            aria-valuemax={isHabitTracker ? todayDayNumber : (daysTotal ?? 75)}
            aria-label={
              isHabitTracker
                ? `Operation day ${todayDayNumber} (open-ended)`
                : `Operation day ${todayDayNumber} of ${daysTotal}`
            }
          >
            <div className="flex items-center gap-px min-w-0">
              {Array.from({ length: segmentTotal }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-0 h-2"
                  style={{
                    background: i < todayDayNumber ? "var(--muted-foreground)" : "var(--secondary)",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] md:text-[11px] tracking-wider text-muted-foreground tabular-nums">
              <span>DAY 01</span>
              <span>
                {isHabitTracker ? "OPEN-ENDED" : `OBJECTIVE: DAY ${daysTotal}`}
              </span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-5 md:mt-8 grid grid-cols-2 gap-px rounded overflow-hidden bg-border">
            {[
              { label: "COMPLETION", value: `${completion}%` },
              { label: "OBJECTIVES", value: `${totalDone}/${totalItems}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-4 py-3 text-center bg-card"
              >
                <p className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-lg md:text-xl font-bold mt-1 tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Day navigator */}
        <div className="mb-6 md:mb-8">
          <DayNavigator
            selectedDayNumber={displayDay}
            todayDayNumber={todayDayNumber}
            startDate={challenge.startDate}
            onDayChange={setSelectedDayNumber}
          />
        </div>

        {/* Sector briefing frame */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-start gap-3 justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-3 h-3 shrink-0 bg-primary" style={{ boxShadow: "0 0 8px var(--primary)" }} aria-hidden="true" />
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-bold tracking-wider text-foreground">DAILY OBJECTIVES</h3>
                <p className="text-[11px] md:text-xs text-muted-foreground">Mission Requirements</p>
              </div>
            </div>
            <span
              className="shrink-0 text-[10px] md:text-[11px] tracking-[0.2em] font-bold px-2.5 py-1.5 border whitespace-nowrap"
              style={{
                borderColor: totalDone === totalItems ? "var(--primary)" : "var(--warning)",
                color: totalDone === totalItems ? "var(--primary)" : "var(--warning)",
              }}
            >
              {totalDone === totalItems ? "ALL CLEAR" : "IN PROGRESS"}
            </span>
          </div>

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
        </motion.div>

        {/* Footer: mission brief */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-8 md:mt-12 pt-5 md:pt-6 text-center border-t border-border"
        >
          <p className="text-[11px] md:text-xs tracking-[0.3em] uppercase text-border leading-relaxed">
            &ldquo;Discipline is the bridge between goals and accomplishment.&rdquo;
          </p>
          <p className="text-[10px] md:text-[11px] mt-2 text-muted tracking-wider">
            TRANSMISSION END // OPERATOR-1
          </p>
        </motion.div>
      </div>
    </div>
  );
}
