"use client";

import { localStore } from "./store";
import { genId } from "./mutations";
import type {
  LocalDB,
  LocalDayPlan,
  LocalPlanBlock,
  LocalWorkSchedule,
} from "./db";

/**
 * Local-mode mirror of `convex/dayPlans.ts`. Same surface, minus auth — we ARE
 * the user. Placement only; completion lives in `habitEntries`.
 */

export interface LocalBlockInput {
  habitDefinitionId?: string;
  kind: "habit" | "break" | "custom" | "busy";
  title?: string;
  startMin: number;
  durationMin: number;
  reminderEnabled: boolean;
}

interface DayArgs {
  date: string;
  workStart: string | null;
  workEnd: string | null;
  windDownAt: string;
}

function ensurePlan(draft: LocalDB, args: DayArgs): LocalDayPlan | null {
  const user = draft.user;
  if (!user || !user.currentChallengeId) return null;
  let plan = draft.dayPlans.find(
    (p) => p.userId === user._id && p.date === args.date,
  );
  if (plan) return plan;
  plan = {
    _id: genId("dayPlan"),
    _creationTime: Date.now(),
    userId: user._id,
    challengeId: user.currentChallengeId,
    date: args.date,
    workStart: args.workStart,
    workEnd: args.workEnd,
    windDownAt: args.windDownAt,
  };
  draft.dayPlans.push(plan);
  return plan;
}

export function ensureToday(args: DayArgs): void {
  localStore.write((draft) => {
    ensurePlan(draft, args);
  });
}

export function setWorkHours(args: DayArgs): void {
  localStore.write((draft) => {
    const plan = ensurePlan(draft, args);
    if (!plan) return;
    const idx = draft.dayPlans.findIndex((p) => p._id === plan._id);
    draft.dayPlans[idx] = {
      ...plan,
      workStart: args.workStart,
      workEnd: args.workEnd,
      windDownAt: args.windDownAt,
    };
  });
}

export function saveWorkScheduleDefault(ws: LocalWorkSchedule): void {
  localStore.write((draft) => {
    if (!draft.user) return;
    draft.user = {
      ...draft.user,
      preferences: { ...draft.user.preferences, workSchedule: ws },
    };
  });
}

export function replacePlannedBlocks(
  args: DayArgs & { blocks: LocalBlockInput[] },
): void {
  localStore.write((draft) => {
    const plan = ensurePlan(draft, args);
    if (!plan) return;
    const user = draft.user!;
    draft.planBlocks = draft.planBlocks.filter((b) => b.dayPlanId !== plan._id);
    for (const b of args.blocks) {
      const block: LocalPlanBlock = {
        _id: genId("planBlock"),
        _creationTime: Date.now(),
        userId: user._id,
        dayPlanId: plan._id,
        date: args.date,
        habitDefinitionId: b.habitDefinitionId,
        kind: b.kind,
        title: b.title,
        startMin: b.startMin,
        durationMin: b.durationMin,
        reminderEnabled: b.reminderEnabled,
      };
      draft.planBlocks.push(block);
    }
    const idx = draft.dayPlans.findIndex((p) => p._id === plan._id);
    draft.dayPlans[idx] = { ...plan, arrangedAt: Date.now() };
  });
}

export function addBlock(args: DayArgs & { block: LocalBlockInput }): string {
  let id = "";
  localStore.write((draft) => {
    const plan = ensurePlan(draft, args);
    if (!plan) return;
    id = genId("planBlock");
    draft.planBlocks.push({
      _id: id,
      _creationTime: Date.now(),
      userId: draft.user!._id,
      dayPlanId: plan._id,
      date: args.date,
      habitDefinitionId: args.block.habitDefinitionId,
      kind: args.block.kind,
      title: args.block.title,
      startMin: args.block.startMin,
      durationMin: args.block.durationMin,
      reminderEnabled: args.block.reminderEnabled,
    });
  });
  return id;
}

function patchBlock(blockId: string, patch: Partial<LocalPlanBlock>): void {
  localStore.write((draft) => {
    const idx = draft.planBlocks.findIndex((b) => b._id === blockId);
    if (idx === -1) return;
    draft.planBlocks[idx] = { ...draft.planBlocks[idx], ...patch };
  });
}

export function moveBlock(blockId: string, startMin: number): void {
  patchBlock(blockId, { startMin, reminderSentAt: undefined });
}

export function resizeBlock(
  blockId: string,
  startMin: number,
  durationMin: number,
): void {
  patchBlock(blockId, {
    startMin,
    durationMin: Math.max(5, durationMin),
    reminderSentAt: undefined,
  });
}

export function removeBlock(blockId: string): void {
  localStore.write((draft) => {
    draft.planBlocks = draft.planBlocks.filter((b) => b._id !== blockId);
  });
}

export function setBlockReminder(blockId: string, enabled: boolean): void {
  patchBlock(blockId, { reminderEnabled: enabled, reminderSentAt: undefined });
}

export function setHabitPlacement(
  habitDefinitionId: string,
  placement: "timeline" | "anytime",
): void {
  localStore.write((draft) => {
    const idx = draft.habitDefinitions.findIndex(
      (h) => h._id === habitDefinitionId,
    );
    if (idx === -1) return;
    draft.habitDefinitions[idx] = {
      ...draft.habitDefinitions[idx],
      defaultPlacement: placement,
    };
  });
}

export function setHabitDuration(
  habitDefinitionId: string,
  estimatedMinutes: number,
): void {
  localStore.write((draft) => {
    const idx = draft.habitDefinitions.findIndex(
      (h) => h._id === habitDefinitionId,
    );
    if (idx === -1) return;
    draft.habitDefinitions[idx] = {
      ...draft.habitDefinitions[idx],
      estimatedMinutes: Math.max(5, Math.min(240, Math.round(estimatedMinutes))),
    };
  });
}
