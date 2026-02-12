"use client";

import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function MilitaryDashboard({ user, challenge }: ThemedDashboardProps) {
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

  // Calculate elapsed time since start of day
  const hours = today.getHours();
  const minutes = today.getMinutes();
  const seconds = today.getSeconds();
  const missionTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="max-w-4xl mx-auto">
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
              {String(dayNumber).padStart(2, "0")}
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
                    background: i < dayNumber ? "var(--muted-foreground)" : "var(--secondary)",
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

        {/* Sector briefing frame */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
        >
          {/* Sector header */}
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

          {/* Daily Checklist */}
          <DailyChecklist
            challengeId={challenge._id}
            userId={user._id}
            dayNumber={dayNumber}
            date={dateStr}
          />
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
