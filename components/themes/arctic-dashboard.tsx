"use client";

import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function ArcticDashboard({ user, challenge }: ThemedDashboardProps) {
  const today = new Date();
  const startDate = new Date(challenge.startDate);
  const dayNumber = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const dateStr = today.toISOString().split("T")[0];
  const completion = Math.round((dayNumber / 75) * 100);

  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    { challengeId: challenge._id }
  );
  const todayLog = logs?.find((l: any) => l.dayNumber === dayNumber);
  const totalDone = todayLog ? [
    !!todayLog.workout1 && todayLog.workout1.durationMinutes >= 45,
    !!todayLog.workout2 && todayLog.workout2.durationMinutes >= 45,
    todayLog.outdoorWorkoutCompleted,
    (todayLog.waterIntakeOz ?? 0) >= 128,
    todayLog.dietFollowed,
    todayLog.noAlcohol,
    (todayLog.readingMinutes ?? 0) >= 20,
    !!todayLog.progressPhotoId,
  ].filter(Boolean).length : 0;
  const totalItems = 8;

  const circumference = 2 * Math.PI * 54;
  const progressOffset = circumference - (completion / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero section — day number with blue backdrop */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative mb-16"
      >
        {/* Giant faint background number */}
        <div
          className="absolute -top-8 -left-4 select-none pointer-events-none text-primary opacity-[0.06]"
          style={{
            fontFamily: "var(--font-heading)",
            fontSize: "280px",
            fontWeight: 700,
            lineHeight: 0.85,
          }}
        >
          {dayNumber}
        </div>

        <div className="relative flex items-start gap-12">
          {/* Left: day number + progress */}
          <div className="flex-1">
            <div className="flex items-end gap-4">
              <h1
                className="text-[140px] md:text-[180px] font-bold leading-[0.85] tracking-tight text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {dayNumber}
              </h1>
              <div className="pb-6">
                <p className="text-4xl font-light text-muted-foreground/40">/75</p>
              </div>
            </div>

            {/* Segmented progress bar */}
            <div className="mt-8 max-w-md">
              <div className="flex gap-1">
                {Array.from({ length: 15 }).map((_, i) => {
                  const segmentDays = 5;
                  const filled = dayNumber >= (i + 1) * segmentDays;
                  const partial = !filled && dayNumber > i * segmentDays;
                  return (
                    <div key={i} className="flex-1 h-3 rounded-sm overflow-hidden bg-muted">
                      <div
                        className="h-full rounded-sm bg-primary"
                        style={{
                          width: filled ? "100%" : partial ? `${((dayNumber % segmentDays) / segmentDays) * 100}%` : "0%",
                          opacity: filled ? 1 : partial ? 0.7 : 0,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
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
      <div className="flex items-center gap-3 mb-8">
        <div className="h-px flex-1 bg-border" />
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rotate-45 bg-primary" />
          <div className="w-2 h-2 rotate-45 bg-primary/60" />
          <div className="w-2 h-2 rotate-45 bg-primary/30" />
        </div>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Today's progress — centered */}
      <div className="text-center mb-12">
        <div className="flex items-baseline justify-center gap-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Today</p>
          <p className="text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            {totalDone}/{totalItems}
          </p>
        </div>
        <div className="mt-2 h-[3px] rounded-full bg-muted max-w-[200px] mx-auto">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(totalDone / totalItems) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      {/* Daily Checklist */}
      <DailyChecklist
        challengeId={challenge._id}
        userId={user._id}
        dayNumber={dayNumber}
        date={dateStr}
      />
    </div>
  );
}
