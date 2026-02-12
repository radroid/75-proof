"use client";

import { motion } from "framer-motion";
import { DailyChecklist } from "@/components/DailyChecklist";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface ThemedDashboardProps {
  user: any;
  challenge: any;
}

export function BroadsheetDashboard({ user, challenge }: ThemedDashboardProps) {
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

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const romanNumerals = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX","XXI","XXII","XXIII","XXIV","XXV","XXVI","XXVII","XXVIII","XXIX","XXX","XXXI","XXXII","XXXIII","XXXIV","XXXV","XXXVI","XXXVII","XXXVIII","XXXIX","XL","XLI","XLII","XLIII","XLIV","XLV","XLVI","XLVII","XLVIII","XLIX","L","LI","LII","LIII","LIV","LV","LVI","LVII","LVIII","LIX","LX","LXI","LXII","LXIII","LXIV","LXV","LXVI","LXVII","LXVIII","LXIX","LXX","LXXI","LXXII","LXXIII","LXXIV","LXXV"];
  const vol = romanNumerals[Math.min(dayNumber - 1, 74)] || String(dayNumber);

  const hours = today.getHours();
  const edition = hours < 12 ? "Morning Edition" : hours < 17 ? "Afternoon Edition" : "Evening Edition";

  return (
    <div className="max-w-4xl mx-auto">
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
          {/* Top rule - double line */}
          <div className="border-t-[3px] border-foreground pt-[2px] border-b border-foreground">
            <div className="h-[2px]" />
          </div>

          {/* Date & edition bar */}
          <div className="flex items-center justify-between py-2 text-[11px] tracking-wider uppercase text-muted-foreground border-b border-border">
            <span>{formattedDate}</span>
            <span>{edition}</span>
            <span>Vol. {vol} — No. {dayNumber}</span>
          </div>

          {/* Newspaper title */}
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

          {/* Stats strip */}
          <div className="flex items-center justify-between py-3 text-[10px] tracking-wider uppercase text-muted-foreground border-b-2 border-foreground">
            <div>
              <span className="text-foreground text-[16px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {totalDone}/{totalItems}
              </span>
              {" "}Objectives Today
            </div>
            <div>
              <span className="text-foreground text-[16px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                {completion}%
              </span>
              {" "}Campaign Complete
            </div>
          </div>
        </motion.header>

        {/* Checklist area */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
          <DailyChecklist
            challengeId={challenge._id}
            userId={user._id}
            dayNumber={dayNumber}
            date={dateStr}
          />
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
                  height: i < dayNumber ? "100%" : "20%",
                  background: i < dayNumber ? "var(--foreground)" : "var(--border)",
                  opacity: i < dayNumber ? 1 : 0.4,
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
