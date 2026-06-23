"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { api } from "@/convex/_generated/api";
import { useGuest } from "@/components/guest-provider";
import { useHabitEntries } from "@/hooks/use-habit-entries";
import { useDayPlan, type PlanBlockInput } from "@/hooks/use-day-plan";
import {
  getTodayInTimezone,
  getUserTimezone,
  computeDayNumber,
  formatDateShort,
} from "@/lib/day-utils";
import { hhmmToMin, nowMinutesInTz, formatDuration } from "@/lib/plan/time";
import { autoArrange } from "@/lib/plan/auto-arrange";
import {
  resolveDuration,
  resolvePlacement,
} from "@/lib/plan/duration-heuristics";
import type { PlanHabit } from "@/lib/plan/types";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { WorkHoursBar, type WorkHoursSave } from "@/components/plan/WorkHoursBar";
import { PlanTimeline } from "@/components/plan/PlanTimeline";
import { AnytimeTray } from "@/components/plan/AnytimeTray";
import { PlanEmptyState } from "@/components/plan/PlanEmptyState";

function PlanSkeleton() {
  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
        <div className="h-16 w-full rounded-xl bg-muted animate-pulse" />
        <div className="h-40 w-full rounded-xl bg-muted animate-pulse" />
      </div>
    </PageContainer>
  );
}

/** Route shell: flag gate + user/challenge resolution, then the board. */
export function PlanClient() {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== "production";
  const flag = useFeatureFlagEnabled("after-work-plan");
  const allowed = isDev || flag === true;

  const { isGuest, demoUser, demoChallenge } = useGuest();
  const convexUser = useQuery(
    api.users.getCurrentUser,
    isGuest ? "skip" : {},
  );
  const convexChallenge = useQuery(
    api.challenges.getChallenge,
    !isGuest && convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip",
  );

  useEffect(() => {
    if (!isDev && flag === false) router.replace("/dashboard");
  }, [isDev, flag, router]);

  if (!allowed) return <PlanSkeleton />;

  const user = isGuest ? demoUser : convexUser;
  const challenge = isGuest ? demoChallenge : convexChallenge;
  if (!user || !challenge) return <PlanSkeleton />;

  return <PlanBoard user={user} challenge={challenge} />;
}

// `user` / `challenge` come from either Convex (`Doc`) or the local store; the
// existing themed dashboards likewise accept these as `any`. We only read a
// small, shared slice of fields.
function PlanBoard({ user, challenge }: { user: any; challenge: any }) {
  const tz: string = user.preferences?.timezone || getUserTimezone();
  const today = getTodayInTimezone(tz);
  const dayNumber = computeDayNumber(challenge.startDate, today);

  const { habitDefs, entryMap, handleToggleTask, handleUpdateCounter } =
    useHabitEntries({
      challengeId: challenge._id,
      userId: user._id,
      dayNumber,
      date: today,
      userTimezone: tz,
      isEditable: true,
    });

  const {
    header,
    hasPlan,
    workSchedule,
    blocks,
    isLoading,
    ensureToday,
    setWorkHours,
    replaceBlocks,
    removeBlock,
    setBlockReminder,
  } = useDayPlan({ date: today });

  const [forceBar, setForceBar] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const [nowMin, setNowMin] = useState<number | null>(null);

  // Live "now" marker, refreshed each minute (client-only to avoid SSR drift).
  useEffect(() => {
    setNowMin(nowMinutesInTz(tz));
    const id = setInterval(() => setNowMin(nowMinutesInTz(tz)), 60_000);
    return () => clearInterval(id);
  }, [tz]);

  // Map habit definitions -> PlanHabit with today's completion folded in.
  const planHabits: PlanHabit[] = (habitDefs ?? []).map((h: any) => ({
    id: h._id,
    name: h.name,
    blockType: h.blockType,
    target: h.target,
    unit: h.unit,
    isHard: h.isHard,
    category: h.category,
    icon: h.icon,
    sortOrder: h.sortOrder,
    estimatedMinutes: h.estimatedMinutes,
    defaultPlacement: h.defaultPlacement,
    completed: entryMap.get(h._id)?.completed ?? false,
  }));
  const habitsById = new Map(planHabits.map((h) => [h.id, h]));
  const timelineHabits = planHabits
    .filter((h) => resolvePlacement(h) === "timeline")
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const anytimeHabits = planHabits.filter(
    (h) => resolvePlacement(h) === "anytime",
  );

  // Seed today's plan once a saved schedule exists.
  useEffect(() => {
    if (!isLoading && workSchedule && !hasPlan) ensureToday();
  }, [isLoading, workSchedule, hasPlan, ensureToday]);

  // Auto-arrange once on a freshly-seeded, never-arranged plan.
  const arrangedRef = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading || !hasPlan) return;
    if (blocks.length > 0 || timelineHabits.length === 0) return;
    if (header.arrangedAt || arrangedRef.current === today) return;
    arrangedRef.current = today;
    void runAutoArrange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, hasPlan, blocks.length, timelineHabits.length, header.arrangedAt, today]);

  async function runAutoArrange() {
    const workEndMin = header.workEnd ? hhmmToMin(header.workEnd) : null;
    const windDownMin = hhmmToMin(header.windDownAt);
    const result = autoArrange({
      workEndMin,
      windDownMin,
      nowMin: nowMinutesInTz(tz),
      habits: timelineHabits.map((h) => ({
        id: h.id,
        durationMin: resolveDuration(h),
      })),
    });
    setOverflow(result.overflow);
    const next: PlanBlockInput[] = result.blocks.map((b) => ({
      habitDefinitionId: b.habitId,
      kind: "habit",
      startMin: b.startMin,
      durationMin: b.durationMin,
      reminderEnabled: true,
    }));
    await replaceBlocks(next);
  }

  function toggleHabitDone(habit: PlanHabit) {
    if (habit.blockType === "counter") {
      const cur = entryMap.get(habit.id)?.value ?? 0;
      const target = habit.target ?? 1;
      const delta = habit.completed ? -cur : target - cur;
      handleUpdateCounter(habit.id, cur, delta);
    } else {
      handleToggleTask(habit.id);
    }
  }

  function handleSaveHours(next: WorkHoursSave) {
    setForceBar(true);
    void setWorkHours({
      workStart: next.workStart,
      workEnd: next.workEnd,
      windDownAt: next.windDownAt,
      saveAsDefault: next.saveAsDefault,
    });
  }

  if (isLoading) return <PlanSkeleton />;

  const showEmpty = !hasPlan && !workSchedule && !forceBar;
  const windDownMin = hhmmToMin(header.windDownAt);
  const freeLabel =
    nowMin === null
      ? ""
      : windDownMin > nowMin
        ? `${formatDuration(windDownMin - nowMin)} free left`
        : "past wind-down";

  return (
    <PageContainer>
      <div className="max-w-2xl mx-auto">
        <header className="mb-5">
          <h1
            className="text-2xl font-semibold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Plan
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDateShort(today)} · Day {dayNumber}
          </p>
        </header>

        {showEmpty ? (
          <PlanEmptyState onSetHours={() => setForceBar(true)} />
        ) : (
          <>
            <WorkHoursBar
              workStart={header.workStart}
              workEnd={header.workEnd}
              windDownAt={header.windDownAt}
              hasSchedule={!!workSchedule}
              startOpen={forceBar && !hasPlan}
              onSave={handleSaveHours}
            />

            <div className="flex items-baseline justify-between mt-6 mb-3 px-1">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                After work
              </span>
              {freeLabel && (
                <span className="text-[11px] text-success">{freeLabel}</span>
              )}
            </div>

            {blocks.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  {timelineHabits.length === 0
                    ? "No timeline habits to schedule yet."
                    : "Nothing scheduled yet."}
                </p>
                {timelineHabits.length > 0 && (
                  <Button onClick={() => void runAutoArrange()}>
                    Auto-arrange my evening
                  </Button>
                )}
              </div>
            ) : (
              <>
                <PlanTimeline
                  blocks={blocks}
                  habitsById={habitsById}
                  nowMin={nowMin ?? 0}
                  onToggleDone={toggleHabitDone}
                  onRemoveBlock={(id) => void removeBlock(id)}
                  onToggleReminder={(id, en) => void setBlockReminder(id, en)}
                />
                {overflow && (
                  <p
                    className="mt-3 px-1 text-[12px]"
                    style={{ color: "var(--warning)" }}
                  >
                    Heads up — this runs past your wind-down. Trim or move a
                    block.
                  </p>
                )}
                <div className="mt-5 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void runAutoArrange()}
                  >
                    Re-arrange
                  </Button>
                </div>
              </>
            )}

            <AnytimeTray habits={anytimeHabits} onToggleDone={toggleHabitDone} />
          </>
        )}
      </div>
    </PageContainer>
  );
}
