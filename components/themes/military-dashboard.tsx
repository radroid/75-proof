"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { GuestDailyChecklist } from "@/components/GuestDailyChecklist";
import { DayNavigator } from "@/components/DayNavigator";
import { SwipeableDayView } from "@/components/swipeable-day-view";
import { ChallengeFailedDialog } from "@/components/ChallengeFailedDialog";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useChallengeStatus } from "@/hooks/use-challenge-status";
import { useGuest } from "@/components/guest-provider";
import { isDayEditable, getDateForDay, computeDayNumber, getTodayInTimezone, getUserTimezone } from "@/lib/day-utils";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function MilitaryDashboard({ user, challenge }: ThemedDashboardProps) {
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
  const completion = Math.round((todayDayNumber / 75) * 100);

  const [showFailedDialog, setShowFailedDialog] = useState(true);
  const hasFailed = !isGuest && statusResult?.status === "failed";

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

  const selectedLog = effectiveLogs?.find((l: any) => l.dayNumber === displayDay);
  const logTotalDone = selectedLog ? [
    !!selectedLog.workout1 && selectedLog.workout1.durationMinutes >= 45,
    !!selectedLog.workout2 && selectedLog.workout2.durationMinutes >= 45,
    selectedLog.outdoorWorkoutCompleted,
    (selectedLog.waterIntakeOz ?? 0) >= 128,
    selectedLog.dietFollowed,
    selectedLog.noAlcohol,
    (selectedLog.readingMinutes ?? 0) >= 20,
    !!selectedLog.progressPhotoId,
  ].filter(Boolean).length : 0;
  const totalDone = isGuest && guestTotalDone !== null ? guestTotalDone : logTotalDone;
  const totalItems = 8;

  const today = new Date();
  const hours = today.getHours();
  const minutes = today.getMinutes();
  const seconds = today.getSeconds();
  const missionTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto">
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
          className="flex items-center justify-between text-[10px] tracking-[0.3em] uppercase mb-10 pb-4 border-b border-border"
        >
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">CLASSIFIED</span>
            <span className="text-border">|</span>
            <span className="text-foreground">OPERATOR-1</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-foreground">MISSION TIME: {missionTime}</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse bg-primary" />
              <span className="text-primary">ACTIVE</span>
            </div>
          </div>
        </motion.div>

        {/* Hero: Day counter in stencil */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <p className="text-[10px] tracking-[0.4em] uppercase mb-4 text-muted-foreground">
            OPERATION DAY
          </p>
          <div className="flex items-baseline gap-3">
            <h1
              className="text-[100px] md:text-[140px] leading-none text-foreground"
              style={{
                fontFamily: "var(--font-heading)",
                textShadow: "0 0 40px rgba(194,178,128,0.15)",
              }}
            >
              {String(displayDay).padStart(2, "0")}
            </h1>
            <span className="text-3xl font-light text-border">/75</span>
          </div>

          {/* 75-segment tactical progress bar */}
          <div className="mt-6 max-w-xl">
            <div className="flex items-center gap-[1px]">
              {Array.from({ length: 75 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 h-2"
                  style={{
                    background: i < todayDayNumber ? "var(--muted-foreground)" : "var(--secondary)",
                    borderRight: i < 74 ? "1px solid var(--background)" : "none",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-3 text-[10px] tracking-wider text-muted-foreground">
              <span>DAY 01</span>
              <span>OBJECTIVE: DAY 75</span>
            </div>
          </div>

          {/* Stats grid */}
          <div className="mt-8 grid grid-cols-2 gap-px rounded overflow-hidden bg-border">
            {[
              { label: "COMPLETION", value: `${completion}%` },
              { label: "OBJECTIVES", value: `${totalDone}/${totalItems}` },
            ].map((stat) => (
              <div
                key={stat.label}
                className="px-4 py-3 text-center bg-card"
              >
                <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground">
                  {stat.label}
                </p>
                <p className="text-lg font-bold mt-1" style={{ fontFamily: "var(--font-heading)" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Day navigator */}
        <div className="mb-8">
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-primary" style={{ boxShadow: "0 0 8px var(--primary)" }} />
              <div>
                <h3 className="text-sm font-bold tracking-wider text-foreground">DAILY OBJECTIVES</h3>
                <p className="text-[10px] text-muted-foreground">Mission Requirements</p>
              </div>
            </div>
            <span
              className="text-[9px] tracking-[0.2em] font-bold px-3 py-1 border"
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
            {isGuest ? (
              <GuestDailyChecklist dayNumber={displayDay} onCompletionChange={setGuestTotalDone} />
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
          className="mt-12 pt-6 text-center border-t border-border"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-border">
            &ldquo;Discipline is the bridge between goals and accomplishment.&rdquo;
          </p>
          <p className="text-[9px] mt-2 text-muted">
            TRANSMISSION END // OPERATOR-1
          </p>
        </motion.div>
      </div>
    </div>
  );
}
