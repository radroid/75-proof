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
import { isDayEditable, getDateForDay, computeDayNumber, getTodayInTimezone, getUserTimezone } from "@/lib/day-utils";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function BroadsheetDashboard({ user, challenge }: ThemedDashboardProps) {
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

  const newSystemEntryMap = new Map((habitEntries ?? []).map((e: any) => [e.habitDefinitionId, e]));
  const newTotalDone = isNewSystem ? (habitDefs?.filter((h: any) => newSystemEntryMap.get(h._id)?.completed).length ?? 0) : 0;
  const newTotalItems = isNewSystem ? (habitDefs?.length ?? 0) : 8;

  const totalDone = isGuest && guestTotalDone !== null ? guestTotalDone : isNewSystem ? newTotalDone : legacyTotalDone;
  const totalItems = isNewSystem ? newTotalItems : 8;

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX","XXXI","XXXII","XXXIII","XXXIV","XXXV","XXXVI","XXXVII","XXXVIII","XXXIX","XL","XLI","XLII","XLIII","XLIV","XLV","XLVI","XLVII","XLVIII","XLIX","L","LI","LII","LIII","LIV","LV","LVI","LVII","LVIII","LIX","LX","LXI","LXII","LXIII","LXIV","LXV","LXVI","LXVII","LXVIII","LXIX","LXX","LXXI","LXXII","LXXIII","LXXIV","LXXV"];
  const vol = romanNumerals[Math.min(todayDayNumber - 1, 74)] || String(todayDayNumber);

  const hours = today.getHours();
  const edition = hours < 12 ? "Morning Edition" : hours < 17 ? "Afternoon Edition" : "Evening Edition";

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

      {/* Newsprint texture overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        {/* Masthead */}
        <motion.header
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="border-t-[3px] border-foreground pt-[2px] border-b border-foreground">
            <div className="h-[2px]" />
          </div>

          <div className="flex items-center justify-between py-2 text-[11px] tracking-wider uppercase text-muted-foreground border-b border-border">
            <span>{formattedDate}</span>
            <span>{edition}</span>
            <span>Vol. {vol} — No. {todayDayNumber}</span>
          </div>

          <div className="text-center py-6 border-b border-border">
            <h1
              className="text-5xl md:text-6xl tracking-tight font-bold text-foreground"
              style={{
                fontFamily: "var(--font-heading)",
                letterSpacing: "-0.02em",
              }}
            >
              The 75 Proof Daily
            </h1>
            <p className="mt-1 text-xs tracking-[0.35em] uppercase text-muted-foreground">
              A Record of Discipline & Transformation
            </p>
          </div>

          <div className="flex items-center justify-between py-3 text-[10px] tracking-wider uppercase text-muted-foreground border-b-2 border-foreground">
            <div>
              <span className="text-foreground text-[16px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {totalDone}/{totalItems}
              </span>
              {" "}Objectives
            </div>
            <div>
              <span className="text-foreground text-[16px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {completion}%
              </span>
              {" "}Campaign Complete
            </div>
          </div>
        </motion.header>

        {/* Day navigator */}
        <div className="mt-6 mb-2">
          <DayNavigator
            selectedDayNumber={displayDay}
            todayDayNumber={todayDayNumber}
            startDate={challenge.startDate}
            onDayChange={setSelectedDayNumber}
          />
        </div>

        {/* Checklist area */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
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
        </motion.div>

        {/* Pull quote */}
        <motion.blockquote
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="my-12 py-6 px-6 border-t-2 border-b-2 border-foreground"
        >
          <p
            className="text-2xl leading-snug italic text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            &ldquo;Discipline is choosing between what you want now and what you want most.&rdquo;
          </p>
          <p className="mt-3 text-xs tracking-widest uppercase text-muted-foreground">
            — Abraham Lincoln
          </p>
        </motion.blockquote>

        {/* 75-Day progress bar chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
        >
          <p className="text-[11px] tracking-widest uppercase mb-4 font-medium text-muted-foreground">
            75-Day Campaign Progress
          </p>
          <div className="flex items-end gap-[2px] h-16">
            {Array.from({ length: 75 }).map((_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  height: i < todayDayNumber ? "100%" : "20%",
                  background: i < todayDayNumber ? "var(--foreground)" : "var(--border)",
                  opacity: i < todayDayNumber ? 1 : 0.4,
                }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
            <span>Day 1</span>
            <span>Day 75</span>
          </div>
        </motion.div>

        {/* Footer — colophon */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-10 pt-4 text-center border-t-[3px] border-foreground"
        >
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
            Published continuously since Day 1 — All rights reserved — 75 Proof Daily
          </p>
        </motion.footer>
      </div>
    </div>
  );
}
