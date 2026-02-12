"use client";

import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function ZenDashboard({ user, challenge }: ThemedDashboardProps) {
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

  const circumference = 2 * Math.PI * 68;
  const progressOffset = circumference - (completion / 100) * circumference;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Subtle washi paper texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='6' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10">
        {/* Top — minimal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between mb-20"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
            Seventy-Five Hard
          </p>
          <p className="text-xs text-muted-foreground">
            Day {dayNumber}
          </p>
        </motion.div>

        {/* Hero: Enso circle with day number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.8 }}
          className="flex flex-col items-center mb-24"
        >
          {/* Enso circle */}
          <div className="relative">
            <svg width="180" height="180" viewBox="0 0 180 180">
              {/* Brush-stroke enso — imperfect circle */}
              <circle
                cx="90" cy="90" r="68"
                fill="none"
                className="stroke-foreground"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.15"
                strokeDasharray="4 8"
              />
              {/* Progress arc */}
              <motion.circle
                cx="90" cy="90" r="68"
                fill="none"
                className="stroke-primary"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
                transform="rotate(-90 90 90)"
              />
            </svg>

            {/* Day number centered */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-6xl font-light leading-none text-foreground"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {dayNumber}
              </span>
              <span className="text-[10px] tracking-[0.3em] uppercase mt-2 text-muted-foreground">
                of seventy-five
              </span>
            </div>
          </div>

          {/* Today's fulfillment */}
          <div className="text-center mt-12">
            <p
              className="text-2xl font-light text-foreground"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {totalDone}/{totalItems}
            </p>
            <p className="text-[10px] tracking-[0.2em] uppercase mt-1 text-muted-foreground">
              fulfilled today
            </p>
          </div>
        </motion.div>

        {/* Horizontal brush stroke divider */}
        <div className="flex items-center justify-center mb-16">
          <svg width="200" height="8" viewBox="0 0 200 8">
            <path
              d="M 0 4 Q 50 1, 100 4 Q 150 7, 200 4"
              fill="none"
              className="stroke-muted-foreground"
              strokeWidth="1.5"
              opacity="0.4"
            />
          </svg>
        </div>

        {/* Daily Checklist with generous spacing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-8"
        >
          <DailyChecklist
            challengeId={challenge._id}
            userId={user._id}
            dayNumber={dayNumber}
            date={dateStr}
          />
        </motion.div>

        {/* Footer — zen quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-24 text-center"
        >
          {/* Brush stroke divider */}
          <svg width="60" height="3" viewBox="0 0 60 3" className="mx-auto mb-8">
            <line x1="0" y1="1.5" x2="60" y2="1.5" className="stroke-muted-foreground" strokeWidth="1" opacity="0.4" />
          </svg>

          <p
            className="text-lg italic text-muted-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            &ldquo;Fall seven times, stand up eight.&rdquo;
          </p>
          <p className="text-[10px] tracking-[0.2em] uppercase mt-3 text-muted">
            &#x4E03;&#x8EE2;&#x3073;&#x516B;&#x8D77;&#x304D;
          </p>
        </motion.div>
      </div>
    </div>
  );
}
