"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import { ChallengeFailedDialog } from "@/components/ChallengeFailedDialog";
import { ChallengeCompletedDialog } from "@/components/ChallengeCompletedDialog";
import { ReconciliationDialog } from "@/components/ReconciliationDialog";
import { useChallengeStatus } from "@/hooks/use-challenge-status";
import { useReconciliation } from "@/hooks/use-reconciliation";
import { useHabitEntries } from "@/hooks/use-habit-entries";
import { useGuest } from "@/components/guest-provider";
import {
  effectiveDaysTotal,
  getDateForDay,
} from "@/lib/day-utils";
import {
  useLocalActiveHabitDefinitions,
  useLocalAllEntriesForChallenge,
} from "@/lib/local-store/hooks";
import {
  currentStreakFrom,
  perHabitStats,
  type HabitDefView,
  type HabitEntryView,
} from "@/lib/progress-metrics";

interface ThemedDashboardProps {
  user: Doc<"users">;
  challenge: Doc<"challenges">;
}

// ─── Hand-drawn brand star (matches design-system/project/assets/star.svg) ──
function Star({ size = 24, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z"
        fill={filled ? "var(--earned-star-gold, #D8A830)" : "none"}
        stroke="var(--earned-ink, #1F1F1D)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ─── Hand-drawn checkbox ──────────────────────────────────────────────
// States: 'empty' | 'star' | 'locked'
function HandCheckbox({
  state,
  size = 36,
  onClick,
  disabled,
  label,
}: {
  state: "empty" | "star" | "locked";
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  const ink = "var(--earned-ink, #1F1F1D)";
  const gold = "var(--earned-star-gold, #D8A830)";
  const sage = "var(--earned-sage, #7A8C6B)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={state === "star"}
      style={{
        width: size,
        height: size,
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 36 36" width={size} height={size} style={{ display: "block" }}>
        {/* hand-trembled square */}
        <path
          d="M4 5 C 14 3, 28 4, 33 6 C 33.5 16, 33 26, 32 32 C 22 33, 10 33, 4 31 C 3 22, 3.5 12, 4 5 Z"
          fill={state === "star" ? gold : "none"}
          stroke={state === "locked" ? sage : ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={state === "locked" ? "3 3" : "none"}
        />
        {state === "star" && (
          <path
            d="M18 6 L21 14 L29 15 L23 20 L25 28 L18 24 L11 28 L13 20 L7 15 L15 14 Z"
            fill={ink}
          />
        )}
      </svg>
    </button>
  );
}

// ─── Sticker-shadow chip ──────────────────────────────────────────────
function PaperChip({
  tone = "cream",
  children,
}: {
  tone?: "cream" | "gold" | "sky";
  children: React.ReactNode;
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    cream: {
      bg: "var(--earned-cream-light, #F9F3E1)",
      fg: "var(--earned-ink, #1F1F1D)",
    },
    gold: {
      bg: "var(--earned-star-gold, #D8A830)",
      fg: "var(--earned-ink, #1F1F1D)",
    },
    sky: {
      bg: "var(--earned-sky, #0090D8)",
      fg: "var(--earned-cream-light, #F9F3E1)",
    },
  };
  const { bg, fg } = palette[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        color: fg,
        border: "1.5px solid var(--earned-ink, #1F1F1D)",
        padding: "6px 14px",
        borderRadius: 999,
        fontFamily: "var(--font-poppins), system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 13,
        boxShadow: "2px 2px 0 var(--earned-ink, #1F1F1D)",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

interface HabitRowData {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  isHard: boolean;
}

function HandHabitRow({
  habit,
  onToggle,
  isEditable,
}: {
  habit: HabitRowData;
  onToggle: () => void;
  isEditable: boolean;
}) {
  const ink = "var(--earned-ink, #1F1F1D)";
  const creamLight = "var(--earned-cream-light, #F9F3E1)";
  const muted = "rgba(31,31,29,0.55)";
  const checked = habit.completed;
  const state: "empty" | "star" | "locked" = !isEditable && !checked
    ? "locked"
    : checked
      ? "star"
      : "empty";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: checked ? creamLight : "transparent",
        border: `1.5px ${checked ? "solid" : "dashed"} ${ink}`,
        boxShadow: checked ? `2px 2px 0 ${ink}` : "none",
        borderRadius: 10,
      }}
    >
      <HandCheckbox
        state={state}
        onClick={isEditable ? onToggle : undefined}
        disabled={!isEditable}
        label={`${checked ? "Unmark" : "Mark"} ${habit.name}`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-caveat), 'Caveat', cursive",
            fontWeight: 600,
            fontSize: 24,
            lineHeight: 1.05,
            color: ink,
            textDecoration: checked
              ? "underline wavy var(--earned-star-gold, #D8A830)"
              : "none",
            textUnderlineOffset: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {habit.name}
        </div>
        {habit.isHard && (
          <div
            style={{
              fontFamily: "var(--font-poppins), system-ui, sans-serif",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: muted,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            Hard
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-caveat), 'Caveat', cursive",
            fontSize: 22,
            lineHeight: 1,
            color: ink,
            fontWeight: 600,
          }}
        >
          {habit.streak}
        </div>
        <div
          style={{
            fontFamily: "var(--font-poppins), system-ui, sans-serif",
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: muted,
            fontWeight: 600,
          }}
        >
          {habit.streak === 1 ? "day" : "days"}
        </div>
      </div>
    </div>
  );
}

// Format a date like "Wed, May 13" from a YYYY-MM-DD ISO string.
function formatHandwrittenDate(iso: string): string {
  // Parse as local-date by appending T12:00 — avoids the UTC-midnight bug
  // where new Date("2026-05-13") parses as the prior day for west-of-UTC
  // viewers.
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function EarnedDashboard({ user, challenge }: ThemedDashboardProps) {
  const { isGuest } = useGuest();
  const { todayDayNumber, userTimezone, statusResult, recheck } =
    useChallengeStatus(challenge._id, challenge.startDate);

  // Today-only view per the design: no day navigator. Past-day browsing
  // lives in /progress. The active dayNumber is always today; we never
  // expose a "selected day" state on this surface.
  const displayDay = todayDayNumber;
  const dateStr = getDateForDay(challenge.startDate, displayDay);
  const daysTotal = effectiveDaysTotal(challenge); // null = habit tracker
  const isHabitTracker = daysTotal === null;

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

  // Day-level data + mutations. The hook is polymorphic for guest mode.
  const {
    habitDefs,
    entryMap,
    handleToggleTask,
    handleUpdateCounter,
  } = useHabitEntries({
    challengeId: challenge._id,
    userId: user._id,
    dayNumber: displayDay,
    date: dateStr,
    userTimezone,
    isEditable: displayDay >= 1,
  });

  // All-entries for per-habit streak counts. The progress page already
  // pulls this; Convex caches mean we're not double-fetching at runtime.
  const convexAllEntries = useQuery(
    api.habitEntries.getAllEntriesForChallenge,
    isGuest ? "skip" : { challengeId: challenge._id },
  );
  const localAllEntries = useLocalAllEntriesForChallenge(
    isGuest ? (challenge._id as unknown as string) : undefined,
  );
  const allEntries: HabitEntryView[] | undefined = (isGuest
    ? localAllEntries
    : convexAllEntries) as HabitEntryView[] | undefined;

  // Local-mode habit defs (already provided by useHabitEntries). Read again
  // here only to satisfy the perHabitStats input shape (which takes
  // HabitDefView, not the polymorphic narrowed type the hook returns).
  const localActiveDefs = useLocalActiveHabitDefinitions(
    isGuest ? (challenge._id as unknown as string) : undefined,
  );
  const habitDefsForStats: HabitDefView[] | undefined = (isGuest
    ? localActiveDefs
    : habitDefs) as HabitDefView[] | undefined;

  // Lifetime streak: needed for the streak chip. Read from getDayCompletionMap
  // — same path the progress page uses. For habit-tracker mode we still want
  // streak; the helper handles unbounded ranges.
  const convexCompletionMap = useQuery(
    api.challenges.getDayCompletionMap,
    isGuest ? "skip" : { challengeId: challenge._id },
  );
  // Local mode doesn't expose a day completion map; derive lazily from
  // local entries. For v1 we punt and show streak as 0 in local mode so
  // the chip doesn't lie. The progress page's local-store hooks have a
  // proper implementation we can move to in a follow-up.
  const completionMap: Record<number, boolean> = isGuest
    ? {}
    : (convexCompletionMap ?? {});
  const dayStreak = useMemo(
    () => currentStreakFrom(completionMap, todayDayNumber),
    [completionMap, todayDayNumber],
  );

  // Per-habit streaks via the shared progress-metrics util.
  const habitStreakMap = useMemo(() => {
    if (!habitDefsForStats || !allEntries) return new Map<string, number>();
    const stats = perHabitStats(habitDefsForStats, allEntries, displayDay, 90);
    return new Map(stats.map((s) => [s.habitId, s.streak]));
  }, [habitDefsForStats, allEntries, displayDay]);

  const rows: HabitRowData[] = useMemo(() => {
    if (!habitDefs) return [];
    return habitDefs
      .filter((h: { isActive: boolean }) => h.isActive)
      .sort(
        (a: { sortOrder: number }, b: { sortOrder: number }) =>
          a.sortOrder - b.sortOrder,
      )
      .map((h) => {
        const entry = entryMap.get(h._id);
        // Counter habits in this view treat tap as "mark target reached" or
        // "unmark." Counter incremental logging stays on the other themed
        // dashboards / progress until we redesign the counter row.
        const completed = !!entry?.completed;
        return {
          id: h._id,
          name: h.name,
          completed,
          streak: habitStreakMap.get(h._id) ?? 0,
          isHard: h.isHard,
        } satisfies HabitRowData;
      });
  }, [habitDefs, entryMap, habitStreakMap]);

  const earnedCount = rows.filter((r) => r.completed).length;
  const allDone = rows.length > 0 && earnedCount === rows.length;

  const { isActive: confettiActive, trigger: triggerConfetti } = useConfetti();
  const markDayCompleteConvex = useMutation(api.habitEntries.markDayComplete);
  const shouldReduceMotion = useReducedMotion();

  const onToggleHabit = (habitId: string, isCounter: boolean) => {
    const entry = entryMap.get(habitId);
    if (isCounter) {
      // Binary semantics for v1: tap to fill to target, tap again to clear.
      const def = habitDefs?.find((h: { _id: string }) => h._id === habitId);
      const target = (def as { target?: number } | undefined)?.target ?? 1;
      const current = entry?.value ?? 0;
      const isComplete = !!entry?.completed || current >= target;
      const delta = isComplete ? -current : target - current;
      void handleUpdateCounter(habitId, current, delta);
    } else {
      void handleToggleTask(habitId);
    }
    // Fire confetti + day-complete mutation when we flip the last habit on.
    const willComplete =
      rows.filter((r) => r.id === habitId ? !r.completed : r.completed)
        .length === rows.length;
    if (willComplete) {
      triggerConfetti();
      if (!isGuest) {
        markDayCompleteConvex({
          challengeId: challenge._id,
          dayNumber: displayDay,
        }).catch(() => {
          // Backend dedupes; silently ignore failures.
        });
      }
    }
  };

  // Loading: don't render the celebration / footer until rows have hydrated.
  const isLoading = habitDefs === undefined;

  // No habits configured yet — show a friendly handwritten prompt rather
  // than a blank page. The other themed dashboards bounce through
  // category headers; the Earned vibe is "your page is empty, write
  // something in."
  const noHabits = !isLoading && rows.length === 0;

  return (
    <div
      className="paper-ruled paper-ruled-margin"
      style={{
        minHeight: "100dvh",
        marginInline: "calc(50% - 50dvw)",
        paddingInline: "calc(50dvw - 50%)",
      }}
    >
      <Confetti isActive={confettiActive} />

      {!isGuest && statusResult?.status === "failed" && (
        <ChallengeFailedDialog
          open={showFailedDialog}
          failedOnDay={statusResult.failedOnDay!}
          streakReached={Math.max((statusResult.failedOnDay ?? 1) - 1, 0)}
          attemptNumber={1}
          onStartNew={() => {
            setShowFailedDialog(false);
            window.location.reload();
          }}
          onDismiss={() => setShowFailedDialog(false)}
        />
      )}

      {needsReconciliation &&
        statusResult?.status === "needs_reconciliation" && (
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

      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          padding: "48px 22px 64px 56px",
        }}
      >
        {/* Page header — handwritten date + Day N (of Total) */}
        <header>
          <div
            style={{
              fontFamily: "var(--font-caveat), 'Caveat', cursive",
              fontWeight: 600,
              fontSize: 32,
              lineHeight: 1,
              color: "var(--earned-ink, #1F1F1D)",
            }}
          >
            {formatHandwrittenDate(dateStr)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 4,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-poppins), system-ui, sans-serif",
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(31,31,29,0.55)",
                fontWeight: 600,
              }}
            >
              Day
            </div>
            <div
              style={{
                fontFamily: "var(--font-caveat), 'Caveat', cursive",
                fontWeight: 700,
                fontSize: 56,
                lineHeight: 0.9,
                color: "var(--earned-ink, #1F1F1D)",
              }}
            >
              {displayDay}
            </div>
            {!isHabitTracker && daysTotal && (
              <div
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontWeight: 500,
                  fontSize: 26,
                  color: "rgba(31,31,29,0.55)",
                }}
              >
                of {daysTotal}
              </div>
            )}
            {isHabitTracker && (
              <div
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontWeight: 500,
                  fontSize: 26,
                  color: "rgba(31,31,29,0.55)",
                }}
                aria-label="habit tracker"
              >
                ∞
              </div>
            )}
          </div>
        </header>

        {/* Chip row — streak + done count */}
        {!isLoading && !noHabits && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              marginTop: 14,
            }}
          >
            <PaperChip tone="gold">
              <Star size={16} />
              <span
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {dayStreak}
              </span>
              <span style={{ marginLeft: 2 }}>
                {dayStreak === 1 ? "day streak" : "day streak"}
              </span>
            </PaperChip>
            <PaperChip tone="sky">
              <span
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1,
                }}
              >
                {earnedCount}
              </span>
              <span>
                of {rows.length} done
              </span>
            </PaperChip>
          </div>
        )}

        {/* Sub-prompt */}
        {!isLoading && !noHabits && (
          <div style={{ marginTop: 18 }}>
            <div
              style={{
                fontFamily: "var(--font-caveat), 'Caveat', cursive",
                fontWeight: 500,
                fontSize: 22,
                color: "rgba(31,31,29,0.65)",
                lineHeight: 1.25,
              }}
            >
              Today I&apos;m showing up for —
            </div>
          </div>
        )}

        {/* Habit list — flat, hand-drawn rows */}
        {!isLoading && rows.length > 0 && (
          <div
            style={{
              marginTop: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {rows.map((row) => {
              const def = habitDefs?.find(
                (h: { _id: string }) => h._id === row.id,
              );
              const isCounter =
                (def as { blockType?: string } | undefined)?.blockType ===
                "counter";
              return (
                <HandHabitRow
                  key={row.id}
                  habit={row}
                  isEditable={displayDay >= 1}
                  onToggle={() => onToggleHabit(row.id, isCounter)}
                />
              );
            })}
          </div>
        )}

        {/* Empty state — no habits yet */}
        {noHabits && (
          <div style={{ marginTop: 32 }}>
            <div
              style={{
                fontFamily: "var(--font-caveat), 'Caveat', cursive",
                fontWeight: 500,
                fontSize: 24,
                color: "rgba(31,31,29,0.6)",
                lineHeight: 1.3,
              }}
            >
              The page is blank. Add a habit from Settings to start showing up.
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 64,
                  border: "1.5px dashed rgba(31,31,29,0.25)",
                  borderRadius: 10,
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        )}

        {/* Footer: all-done celebration or N-more-to-go nudge */}
        <AnimatePresence>
          {!isLoading && rows.length > 0 && allDone && (
            <motion.div
              initial={
                shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, scale: 1 }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { type: "spring", stiffness: 220, damping: 18 }
              }
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
              }}
              role="status"
              aria-live="polite"
            >
              <Star size={72} />
              <div
                style={{
                  fontFamily: "var(--font-caveat), 'Caveat', cursive",
                  fontWeight: 700,
                  fontSize: 30,
                  color: "var(--earned-ink, #1F1F1D)",
                }}
              >
                Day {displayDay} — earned.
              </div>
              <div
                style={{
                  fontFamily: "var(--font-poppins), system-ui, sans-serif",
                  fontSize: 13,
                  color: "rgba(31,31,29,0.6)",
                }}
              >
                I showed up for everything today.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isLoading && rows.length > 0 && !allDone && (
          <div
            style={{
              marginTop: 20,
              paddingTop: 14,
              borderTop: "1px dashed var(--earned-cream-dark, #E8DEC4)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-caveat), 'Caveat', cursive",
                fontWeight: 500,
                fontSize: 20,
                color: "rgba(31,31,29,0.55)",
              }}
            >
              {rows.length - earnedCount} more to go.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
