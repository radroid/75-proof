"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { DynamicDailyChecklist } from "@/components/DynamicDailyChecklist";
import { GuestDailyChecklist } from "@/components/GuestDailyChecklist";
import { DayNavigator } from "@/components/DayNavigator";
import { SwipeableDayView } from "@/components/swipeable-day-view";
import { ChallengeFailedDialog } from "@/components/ChallengeFailedDialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChallengeStatus } from "@/hooks/use-challenge-status";
import { useGuest } from "@/components/guest-provider";
import { isDayEditable, getDateForDay, computeDayNumber, getTodayInTimezone, getUserTimezone, effectiveDaysTotal } from "@/lib/day-utils";
import { ChallengeCompletedDialog } from "@/components/ChallengeCompletedDialog";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function ArcticDashboard({ user, challenge }: ThemedDashboardProps) {
  const { isGuest, demoChallengeLogs, demoLifetimeStats } = useGuest();

  const { todayDayNumber: authTodayDay, userTimezone, statusResult } = useChallengeStatus(
    isGuest ? undefined : challenge._id,
    isGuest ? undefined : challenge.startDate
  );

  const guestTodayDay = isGuest ? computeDayNumber(challenge.startDate, getTodayInTimezone(getUserTimezone())) : 1;
  const todayDayNumber = isGuest ? guestTodayDay : authTodayDay;

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const displayDay = selectedDayNumber ?? todayDayNumber;
  const dateStr = getDateForDay(challenge.startDate, displayDay);
  const isEditable = isDayEditable(displayDay, todayDayNumber);
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
  const hasFailed = !isGuest && statusResult?.status === "failed";
  const hasCompleted = !isGuest && statusResult?.status === "completed";

  const lifetimeStats = useQuery(
    api.challenges.getLifetimeStats,
    isGuest ? "skip" : { userId: user._id }
  );
  const effectiveLifetimeStats = isGuest ? demoLifetimeStats : lifetimeStats;

  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : { challengeId: challenge._id }
  );
  const effectiveLogs = isGuest ? demoChallengeLogs : logs;

  const [guestTotalDone, setGuestTotalDone] = useState<number | null>(null);

  // Detect new habit system
  const habitDefs = useQuery(
    api.habitDefinitions.getActiveHabitDefinitions,
    isGuest ? "skip" : { challengeId: challenge._id }
  );
  const habitEntries = useQuery(
    api.habitEntries.getEntriesForDay,
    isGuest || !habitDefs || habitDefs.length === 0 ? "skip" : { challengeId: challenge._id, dayNumber: displayDay }
  );
  const isNewSystem = !isGuest && (habitDefs?.length ?? 0) > 0;

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

  const totalDone = isGuest && guestTotalDone !== null ? guestTotalDone : isNewSystem ? newTotalDone : legacyTotalDone;
  const totalItems = isNewSystem ? newTotalItems : 8;

  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (completion / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto">
      {hasFailed && (
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

      {hasCompleted && (
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
        {isGuest ? (
          <GuestDailyChecklist key={displayDay} dayNumber={displayDay} isEditable={isEditable} log={selectedLog} onCompletionChange={setGuestTotalDone} />
        ) : isNewSystem ? (
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
