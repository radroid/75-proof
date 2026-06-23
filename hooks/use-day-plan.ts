"use client";

import { useCallback, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useGuest } from "@/components/guest-provider";
import {
  useLocalDayPlan,
  useLocalPlanBlocks,
  useLocalUser,
  useLocalHydrationComplete,
} from "@/lib/local-store/hooks";
import * as localPlan from "@/lib/local-store/plan-mutations";
import type { PlanBlock, WorkSchedule } from "@/lib/plan/types";

interface UseDayPlanArgs {
  date: string;
}

export interface DayPlanHeaderState {
  workStart: string | null;
  workEnd: string | null;
  windDownAt: string;
  arrangedAt?: number;
}

const DEFAULT_WINDDOWN = "22:00";

/** Day-of-week (0=Sun) for a YYYY-MM-DD date string, tz-independent. */
function dowFromISO(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Seed a header from the saved schedule when no plan exists yet. */
function deriveSeedHeader(
  ws: WorkSchedule | null,
  date: string,
): DayPlanHeaderState {
  const windDownAt = ws?.windDownAt ?? DEFAULT_WINDDOWN;
  if (ws && ws.workdays.includes(dowFromISO(date))) {
    return { workStart: ws.defaultStart, workEnd: ws.defaultEnd, windDownAt };
  }
  return { workStart: null, workEnd: null, windDownAt };
}

export interface PlanBlockInput {
  habitDefinitionId?: string;
  kind: PlanBlock["kind"];
  title?: string;
  startMin: number;
  durationMin: number;
  reminderEnabled: boolean;
}

/** Re-brand the plain string habit id to a Convex Id at the call boundary. */
function toConvexBlock(b: PlanBlockInput) {
  return {
    habitDefinitionId: b.habitDefinitionId as Id<"habitDefinitions"> | undefined,
    kind: b.kind,
    title: b.title,
    startMin: b.startMin,
    durationMin: b.durationMin,
    reminderEnabled: b.reminderEnabled,
  };
}

/**
 * Polymorphic data + mutation hook for the after-work Plan timeline.
 * Routes to the local store in guest mode, otherwise Convex. Hook order is
 * stable: both branches' subscriptions always run; only one feeds the return.
 * Placement only — completion is handled separately via `useHabitEntries`.
 */
export function useDayPlan({ date }: UseDayPlanArgs) {
  const { isGuest } = useGuest();

  // --- Convex source ---
  const convexData = useQuery(
    api.dayPlans.getPlanForDay,
    isGuest ? "skip" : { date },
  );
  const cEnsure = useMutation(api.dayPlans.ensureToday);
  const cSetHours = useMutation(api.dayPlans.setWorkHours);
  const cSaveDefault = useMutation(api.dayPlans.saveWorkScheduleDefault);
  const cReplace = useMutation(api.dayPlans.replacePlannedBlocks);
  const cAdd = useMutation(api.dayPlans.addBlock);
  const cMove = useMutation(api.dayPlans.moveBlock);
  const cResize = useMutation(api.dayPlans.resizeBlock);
  const cRemove = useMutation(api.dayPlans.removeBlock);
  const cReminder = useMutation(api.dayPlans.setBlockReminder);
  const cPlacement = useMutation(api.dayPlans.setHabitPlacement);
  const cDuration = useMutation(api.dayPlans.setHabitDuration);

  // --- Local source ---
  const localUser = useLocalUser();
  const localPlanDoc = useLocalDayPlan(isGuest ? date : undefined);
  const localBlocks = useLocalPlanBlocks(isGuest ? date : undefined);
  const localHydrated = useLocalHydrationComplete();

  const workSchedule: WorkSchedule | null = isGuest
    ? (localUser?.preferences.workSchedule ?? null)
    : (convexData?.workSchedule ?? null);

  const rawPlan = isGuest ? localPlanDoc : convexData?.plan;
  const hasPlan = !!rawPlan;
  const plan: DayPlanHeaderState | null = rawPlan
    ? {
        workStart: rawPlan.workStart,
        workEnd: rawPlan.workEnd,
        windDownAt: rawPlan.windDownAt,
        arrangedAt: rawPlan.arrangedAt,
      }
    : null;

  const header: DayPlanHeaderState =
    plan ?? deriveSeedHeader(workSchedule, date);

  const blocks: PlanBlock[] = (isGuest ? localBlocks : convexData?.blocks ?? [])
    .map((b) => ({
      id: b._id as string,
      habitId: b.habitDefinitionId as string | undefined,
      kind: b.kind,
      title: b.title,
      startMin: b.startMin,
      durationMin: b.durationMin,
      reminderEnabled: b.reminderEnabled,
    }))
    .sort((a, b) => a.startMin - b.startMin);

  const isLoading = isGuest ? !localHydrated : convexData === undefined;

  // Keep the effective header available to callbacks without re-creating them.
  const headerRef = useRef(header);
  headerRef.current = header;

  const dayArgs = useCallback(
    () => ({
      date,
      workStart: headerRef.current.workStart,
      workEnd: headerRef.current.workEnd,
      windDownAt: headerRef.current.windDownAt,
    }),
    [date],
  );

  const ensureToday = useCallback(async () => {
    const args = dayArgs();
    try {
      if (isGuest) localPlan.ensureToday(args);
      else await cEnsure(args);
    } catch {
      /* idempotent — ignore */
    }
  }, [isGuest, cEnsure, dayArgs]);

  const setWorkHours = useCallback(
    async (next: {
      workStart: string | null;
      workEnd: string | null;
      windDownAt: string;
      saveAsDefault?: boolean;
      workdays?: number[];
    }) => {
      const args = {
        date,
        workStart: next.workStart,
        workEnd: next.workEnd,
        windDownAt: next.windDownAt,
      };
      try {
        if (isGuest) localPlan.setWorkHours(args);
        else await cSetHours(args);
        if (next.saveAsDefault && next.workStart && next.workEnd) {
          const ws: WorkSchedule = {
            defaultStart: next.workStart,
            defaultEnd: next.workEnd,
            windDownAt: next.windDownAt,
            workdays: next.workdays ?? [1, 2, 3, 4, 5],
          };
          if (isGuest) localPlan.saveWorkScheduleDefault(ws);
          else await cSaveDefault({ workSchedule: ws });
        }
      } catch {
        toast.error("Couldn't save your hours");
      }
    },
    [isGuest, date, cSetHours, cSaveDefault],
  );

  const replaceBlocks = useCallback(
    async (next: PlanBlockInput[]) => {
      const ha = dayArgs();
      try {
        if (isGuest) localPlan.replacePlannedBlocks({ ...ha, blocks: next });
        else await cReplace({ ...ha, blocks: next.map(toConvexBlock) });
      } catch {
        toast.error("Couldn't update your plan");
      }
    },
    [isGuest, cReplace, dayArgs],
  );

  const addBlock = useCallback(
    async (block: PlanBlockInput) => {
      const ha = dayArgs();
      try {
        if (isGuest) return localPlan.addBlock({ ...ha, block });
        return (await cAdd({ ...ha, block: toConvexBlock(block) })) as string;
      } catch {
        toast.error("Couldn't add that block");
        return undefined;
      }
    },
    [isGuest, cAdd, dayArgs],
  );

  const moveBlock = useCallback(
    async (blockId: string, startMin: number) => {
      try {
        if (isGuest) localPlan.moveBlock(blockId, startMin);
        else await cMove({ blockId: blockId as Id<"planBlocks">, startMin });
      } catch {
        toast.error("Couldn't move that block");
      }
    },
    [isGuest, cMove],
  );

  const resizeBlock = useCallback(
    async (blockId: string, startMin: number, durationMin: number) => {
      try {
        if (isGuest) localPlan.resizeBlock(blockId, startMin, durationMin);
        else
          await cResize({
            blockId: blockId as Id<"planBlocks">,
            startMin,
            durationMin,
          });
      } catch {
        toast.error("Couldn't resize that block");
      }
    },
    [isGuest, cResize],
  );

  const removeBlock = useCallback(
    async (blockId: string) => {
      try {
        if (isGuest) localPlan.removeBlock(blockId);
        else await cRemove({ blockId: blockId as Id<"planBlocks"> });
      } catch {
        toast.error("Couldn't remove that block");
      }
    },
    [isGuest, cRemove],
  );

  const setBlockReminder = useCallback(
    async (blockId: string, enabled: boolean) => {
      try {
        if (isGuest) localPlan.setBlockReminder(blockId, enabled);
        else
          await cReminder({ blockId: blockId as Id<"planBlocks">, enabled });
      } catch {
        toast.error("Couldn't update the reminder");
      }
    },
    [isGuest, cReminder],
  );

  const setHabitPlacement = useCallback(
    async (habitId: string, placement: "timeline" | "anytime") => {
      try {
        if (isGuest) localPlan.setHabitPlacement(habitId, placement);
        else
          await cPlacement({
            habitDefinitionId: habitId as Id<"habitDefinitions">,
            placement,
          });
      } catch {
        toast.error("Couldn't move that habit");
      }
    },
    [isGuest, cPlacement],
  );

  const setHabitDuration = useCallback(
    async (habitId: string, estimatedMinutes: number) => {
      try {
        if (isGuest) localPlan.setHabitDuration(habitId, estimatedMinutes);
        else
          await cDuration({
            habitDefinitionId: habitId as Id<"habitDefinitions">,
            estimatedMinutes,
          });
      } catch {
        toast.error("Couldn't update the duration");
      }
    },
    [isGuest, cDuration],
  );

  return {
    plan,
    header,
    hasPlan,
    workSchedule,
    blocks,
    isLoading,
    ensureToday,
    setWorkHours,
    replaceBlocks,
    addBlock,
    moveBlock,
    resizeBlock,
    removeBlock,
    setBlockReminder,
    setHabitPlacement,
    setHabitDuration,
  };
}
