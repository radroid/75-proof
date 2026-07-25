"use client";

import { useState } from "react";
import { DailyChecklist } from "@/components/DailyChecklist";
import {
  PaperSurface,
  EarnedPaperDefs,
  EarnedPageHeader,
  EarnedChip,
  EarnedPrompt,
  EarnedStar,
  EarnedStarReward,
  HandButton,
  EC,
  HAND,
} from "@/components/themes/earned/EarnedPaper";
import { EarnedChecklist } from "@/components/themes/earned/EarnedChecklist";
import { clearStarPositions } from "@/lib/star-stickers";
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
  useLocalDayCompletionMap,
} from "@/lib/local-store/hooks";
import { currentStreakFrom } from "@/lib/progress-metrics";
import type { Doc } from "@/convex/_generated/dataModel";

// The earned dashboard is the default theme's home surface. It keeps the
// exact data/logic of the other themed dashboards (same hooks, dialogs and
// completion math) and only changes the presentation to the earned identity:
// cream paper, a handwritten date, a big Poppins day number, sky progress,
// and a gold star earned when the day is fully done. All colors come from the
// theme tokens; the gold star is the brand reward currency.
interface ThemedDashboardProps {
  user: Doc<"users">;
  challenge: Doc<"challenges">;
}

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Hand-drawn day-stepper arrow that lives in the page header (replaces the
 *  old standalone DayNavigator strip). */
function DayArrow({
  dir,
  onClick,
  disabled,
  label,
}: {
  dir: "left" | "right";
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <HandButton shape="square" onClick={onClick} disabled={disabled} aria-label={label}>
      <svg width="11" height="14" viewBox="0 0 11 14" fill="none" aria-hidden="true">
        <path
          d={dir === "left" ? "M8 2 L3 7 L8 12" : "M3 2 L8 7 L3 12"}
          stroke={EC.ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </HandButton>
  );
}

/** Milestone days earn the louder "Pop + ink burst" reward instead of the
 *  quiet draw-on. Kept rare so the burst stays special: every 25th day (25,
 *  50, 75 …) and the final day of the challenge. */
function isMilestoneDay(day: number, daysTotal: number | null): boolean {
  if (daysTotal != null && day === daysTotal) return true;
  return day > 0 && day % 25 === 0;
}

function handwrittenDate(dateStr: string): string {
  // dateStr is YYYY-MM-DD (local challenge date). Build a stable, locale-free
  // label without touching `Date.now()`.
  const parts = dateStr.split("-").map((n) => parseInt(n, 10));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return "today";
  const [y, m, d] = parts;
  // Zeller-free: use UTC Date purely for weekday math on an explicit date.
  const idx = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return WEEKDAYS[idx] ?? "today";
}

export function EarnedDashboard({ user, challenge }: ThemedDashboardProps) {
  const { isGuest, demoLifetimeStats } = useGuest();

  const { todayDayNumber, userTimezone, statusResult, recheck } = useChallengeStatus(
    challenge._id,
    challenge.startDate,
  );

  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  // Star reward: whether the user has a custom placement (controls the "reset to
  // row" button), and a nonce that re-mounts the overlay to replay the row.
  const [starsCustom, setStarsCustom] = useState(false);
  const [starResetNonce, setStarResetNonce] = useState(0);
  const displayDay = selectedDayNumber ?? todayDayNumber;
  const dateStr = getDateForDay(challenge.startDate, displayDay);
  const isEditable = isGuest
    ? displayDay <= todayDayNumber
    : isDayEditable(displayDay, todayDayNumber);
  const daysTotal = effectiveDaysTotal(challenge); // null = habit-tracker mode
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

  // Real "day streak" — consecutive complete days ending at today. Uses the
  // exact query + helper the Progress page relies on (currentStreakFrom over
  // getDayCompletionMap), so Today and Progress can never disagree. Previously
  // the chip rendered the day *index* (todayDayNumber), which diverges once a
  // graced miss lands: day 40 with a miss still read "40 day streak".
  const convexCompletionMap = useQuery(
    api.challenges.getDayCompletionMap,
    isGuest ? "skip" : { challengeId: challenge._id },
  );
  const localCompletionMap = useLocalDayCompletionMap(
    isGuest ? (challenge._id as string) : undefined,
  );
  const completionMap: Record<number, boolean> = isGuest
    ? (localCompletionMap ?? {})
    : (convexCompletionMap ?? {});
  const currentStreak = currentStreakFrom(completionMap, challenge.currentDay);

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
  // All-habits progress — drives the "N of M done" chip only.
  const newTotalDone = isNewSystem ? (habitDefs?.filter((h: any) => newSystemEntryMap.get(h._id)?.completed).length ?? 0) : 0;
  const newTotalItems = isNewSystem ? (habitDefs?.length ?? 0) : 8;
  // Hard-only completion — the canonical "day earned" rule the rest of the app
  // celebrates and persists (mirrors EarnedChecklist's requiredDone and the
  // Convex markDayComplete, both hard-only). The reward + footer gate on THIS so
  // an undone optional habit can't make the day read as complete everywhere
  // (confetti, streak) yet show zero stars here.
  const newRequiredItems = isNewSystem ? (habitDefs?.filter((h: any) => h.isHard).length ?? 0) : 0;
  const newRequiredDone = isNewSystem
    ? (habitDefs?.filter((h: any) => h.isHard && newSystemEntryMap.get(h._id)?.completed).length ?? 0)
    : 0;

  const totalDone = isNewSystem ? newTotalDone : legacyTotalDone;
  const totalItems = isNewSystem ? newTotalItems : 8;
  // The legacy 8-item system is all-hard, so its completion is already hard-only.
  const requiredItems = isNewSystem ? newRequiredItems : 8;
  const requiredDone = isNewSystem ? newRequiredDone : legacyTotalDone;
  const allDone = requiredItems > 0 && requiredDone === requiredItems;
  const remaining = Math.max(requiredItems - requiredDone, 0);

  const weekdayLabel = displayDay === todayDayNumber ? "today" : handwrittenDate(dateStr);

  return (
    <>
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

      {/* The whole day lives on one ruled notebook page. */}
      <EarnedPaperDefs />
      <PaperSurface
        margin
        className="mx-auto w-full max-w-2xl"
        style={{ borderRadius: 14, overflow: "hidden", minHeight: "72vh" }}
      >
        <div className="relative" style={{ padding: "26px 18px 40px 34px" }}>
          {/* Earned reward — one draggable gold star per task, overlaid on the
              page (no reflow) the moment the whole day is done. Quiet draw-on
              most days, louder Pop+burst on milestones. The user can drag each
              star anywhere; placements are saved per day. Keyed on the day so it
              re-animates when you land on a different completed day. */}
          {allDone && (
            <EarnedStarReward
              key={`${displayDay}-${starResetNonce}`}
              count={requiredItems}
              milestone={isMilestoneDay(displayDay, daysTotal)}
              storageKey={`${challenge._id}:${displayDay}`}
              ariaLabel={`Day ${displayDay} earned — ${requiredItems} ${requiredItems === 1 ? "star" : "stars"}`}
              onArrangementChange={setStarsCustom}
            />
          )}

          {/* Header — handwritten weekday + big day number, day-stepper folded in */}
          <EarnedPageHeader
            date={weekdayLabel}
            day={displayDay}
            total={isHabitTracker ? null : daysTotal}
            trailing={
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <DayArrow
                    dir="left"
                    onClick={() => setSelectedDayNumber(displayDay - 1)}
                    disabled={displayDay <= 1}
                    label={`Go to day ${displayDay - 1}`}
                  />
                  <DayArrow
                    dir="right"
                    onClick={() => setSelectedDayNumber(displayDay + 1)}
                    disabled={displayDay >= todayDayNumber}
                    label={`Go to day ${displayDay + 1}`}
                  />
                </div>
                {displayDay !== todayDayNumber && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayNumber(todayDayNumber)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontFamily: HAND,
                      fontSize: 16,
                      fontWeight: 600,
                      color: EC.skyDeep,
                      lineHeight: 1,
                    }}
                  >
                    back to today →
                  </button>
                )}
              </div>
            }
          />

          {/* Two quiet sticker chips replace the old ring + segmented bar + count */}
          <div className="flex flex-wrap gap-2" style={{ marginTop: 12 }}>
            <EarnedChip tone="gold" tilt={-2.5}>
              <EarnedStar size={15} color={EC.ink} filled />
              <span style={{ fontFamily: HAND, fontSize: 17, fontWeight: 700, lineHeight: 1 }}>
                {currentStreak}
              </span>
              <span style={{ marginLeft: 1 }}>day streak</span>
            </EarnedChip>
            <EarnedChip tone="cream" tilt={2.5}>
              <span
                style={{ fontFamily: HAND, fontSize: 17, fontWeight: 700, lineHeight: 1, color: EC.skyDeep }}
              >
                {totalDone}
              </span>
              <span>of {totalItems} done</span>
            </EarnedChip>
          </div>

          {/* Handwritten prompt */}
          {isEditable && (
            <div style={{ marginTop: 18, marginBottom: 2 }}>
              <EarnedPrompt>
                {displayDay === todayDayNumber
                  ? "Today I’m showing up for —"
                  : "Showing up for —"}
              </EarnedPrompt>
            </div>
          )}

          {/* Habit list */}
          <div style={{ marginTop: 10 }}>
            <SwipeableDayView
              displayDay={displayDay}
              todayDayNumber={todayDayNumber}
              onDayChange={setSelectedDayNumber}
            >
              {isNewSystem ? (
                <EarnedChecklist
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

          {/* Earned footer */}
          <div style={{ marginTop: 22 }}>
            {allDone ? (
              // The gold stars at the top of the page are the reward; the footer
              // is just a quiet sign-off, demoted so it doesn't compete with them.
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, paddingTop: 6 }}>
                <div style={{ fontFamily: HAND, fontWeight: 600, fontSize: 20, color: "rgba(31,31,29,0.66)" }}>
                  Day {displayDay} — earned.
                </div>
                {starsCustom && (
                  <HandButton
                    shape="pill"
                    aria-label="reset stars to a row"
                    onClick={() => {
                      clearStarPositions(`${challenge._id}:${displayDay}`);
                      setStarsCustom(false);
                      setStarResetNonce((nonce) => nonce + 1);
                    }}
                    style={{
                      gap: 5,
                      padding: "5px 12px",
                      fontFamily: HAND,
                      fontSize: 17,
                      fontWeight: 600,
                      color: EC.skyDeep,
                      lineHeight: 1,
                    }}
                  >
                    <span aria-hidden style={{ fontSize: 16 }}>↺</span>
                    reset stars to a row
                  </HandButton>
                )}
              </div>
            ) : (
              <div
                style={{
                  fontFamily: HAND,
                  fontWeight: 500,
                  fontSize: 19,
                  // 0.66 alpha clears WCAG AA on the cream page (was 0.55 ≈ 3.6:1).
                  color: "rgba(31,31,29,0.66)",
                  paddingLeft: 18,
                }}
              >
                {remaining === 1 ? "one more to go." : `${remaining} more to go.`}
              </div>
            )}
          </div>
        </div>
      </PaperSurface>
    </>
  );
}
