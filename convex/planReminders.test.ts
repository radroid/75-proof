/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";
import {
  getLocalHHmm,
  parseHHmm,
  getTodayInTimezone,
  computeDayNumber,
} from "./lib/dayCalculation";

const modules = import.meta.glob("./**/*.ts");
const TZ = "UTC";

// The "due" check compares a block's startMin against the wall-clock minute at
// query time. Anchor test blocks a hair into the future so they stay inside the
// 5-minute window even if the clock ticks while the test runs. Clamp shy of
// midnight so we never wrap past 1439.
function dueStartMin(): number {
  const nowMin = parseHHmm(getLocalHHmm(TZ, new Date()))!;
  return Math.min(nowMin + 2, 1439);
}

async function seedUser(
  t: ReturnType<typeof convexTest>,
  opts: { withSchedule: boolean; notifEnabled?: boolean },
) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      clerkId: "clerk_r",
      displayName: "R",
      preferences: {
        timezone: TZ,
        waterUnit: "oz",
        ...(opts.withSchedule
          ? {
              workSchedule: {
                defaultStart: "09:00",
                defaultEnd: "17:00",
                windDownAt: "22:00",
                workdays: [1, 2, 3, 4, 5],
              },
            }
          : {}),
        ...(opts.notifEnabled === false
          ? {
              notifications: {
                enabled: false,
                morningReminder: true,
                eveningReminder: true,
                morningTime: "08:00",
                eveningTime: "20:00",
              },
            }
          : {}),
      },
    });
    const challengeId = await ctx.db.insert("challenges", {
      userId,
      startDate: "2026-06-01",
      currentDay: 23,
      status: "active",
      visibility: "private",
      daysTotal: 75,
    });
    await ctx.db.patch(userId, { currentChallengeId: challengeId });
    const habitId = await ctx.db.insert("habitDefinitions", {
      challengeId,
      userId,
      name: "Workout",
      blockType: "task",
      isHard: true,
      isActive: true,
      sortOrder: 0,
      category: "fitness",
    });
    return { userId, challengeId, habitId };
  });
}

async function insertBlock(
  t: ReturnType<typeof convexTest>,
  args: {
    userId: Id<"users">;
    challengeId: Id<"challenges">;
    habitId: Id<"habitDefinitions">;
    startMin: number;
    reminderEnabled: boolean;
    reminderSentAt?: number;
  },
) {
  return await t.run(async (ctx) => {
    const dayPlanId = await ctx.db.insert("dayPlans", {
      userId: args.userId,
      challengeId: args.challengeId,
      date: getTodayInTimezone(TZ),
      workStart: "09:00",
      workEnd: "17:00",
      windDownAt: "22:00",
    });
    return await ctx.db.insert("planBlocks", {
      userId: args.userId,
      dayPlanId,
      date: getTodayInTimezone(TZ),
      habitDefinitionId: args.habitId,
      kind: "habit",
      title: "Workout",
      startMin: args.startMin,
      durationMin: 45,
      reminderEnabled: args.reminderEnabled,
      reminderSentAt: args.reminderSentAt,
      source: "auto",
    });
  });
}

describe("planReminders", () => {
  test("finds a due, reminder-enabled block for a scheduled user", async () => {
    const t = convexTest(schema, modules);
    const { userId, challengeId, habitId } = await seedUser(t, { withSchedule: true });
    const blockId = await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: true,
    });

    const due = await t.query(internal.planReminders.findDueBlockReminders, {});
    expect(due).toHaveLength(1);
    expect(due[0].blockId).toBe(blockId);
    expect(due[0].title).toBe("Workout");
  });

  test("skips users with no saved work schedule", async () => {
    const t = convexTest(schema, modules);
    const { userId, challengeId, habitId } = await seedUser(t, { withSchedule: false });
    await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: true,
    });

    const due = await t.query(internal.planReminders.findDueBlockReminders, {});
    expect(due).toHaveLength(0);
  });

  test("skips when notifications are globally disabled", async () => {
    const t = convexTest(schema, modules);
    const { userId, challengeId, habitId } = await seedUser(t, {
      withSchedule: true,
      notifEnabled: false,
    });
    await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: true,
    });

    const due = await t.query(internal.planReminders.findDueBlockReminders, {});
    expect(due).toHaveLength(0);
  });

  test("skips blocks with reminders off or already sent", async () => {
    const t = convexTest(schema, modules);
    const { userId, challengeId, habitId } = await seedUser(t, { withSchedule: true });
    await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: false,
    });
    await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: true,
      reminderSentAt: 1,
    });

    const due = await t.query(internal.planReminders.findDueBlockReminders, {});
    expect(due).toHaveLength(0);
  });

  test("skips a block whose habit is already completed today", async () => {
    const t = convexTest(schema, modules);
    const { userId, challengeId, habitId } = await seedUser(t, {
      withSchedule: true,
    });
    await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: true,
    });
    await t.run(async (ctx) => {
      const ch = await ctx.db.get(challengeId);
      const dayNumber = computeDayNumber(ch!.startDate, getTodayInTimezone(TZ));
      await ctx.db.insert("habitEntries", {
        habitDefinitionId: habitId,
        challengeId,
        userId,
        dayNumber,
        date: getTodayInTimezone(TZ),
        completed: true,
      });
    });

    const due = await t.query(internal.planReminders.findDueBlockReminders, {});
    expect(due).toHaveLength(0);
  });

  test("reserveBlockReminder wins once, then dedupes", async () => {
    const t = convexTest(schema, modules);
    const { userId, challengeId, habitId } = await seedUser(t, { withSchedule: true });
    const localDate = getTodayInTimezone(TZ);
    const blockId = await insertBlock(t, {
      userId,
      challengeId,
      habitId,
      startMin: dueStartMin(),
      reminderEnabled: true,
    });

    const first = await t.mutation(internal.planReminders.reserveBlockReminder, {
      blockId,
      localDate,
    });
    const second = await t.mutation(
      internal.planReminders.reserveBlockReminder,
      { blockId, localDate },
    );
    expect(first).toBe(true);
    expect(second).toBe(false);

    const deliveries = await t.run((ctx) =>
      ctx.db.query("blockReminderDeliveries").collect(),
    );
    expect(deliveries).toHaveLength(1);

    // Once reserved, the block no longer surfaces as due.
    const due = await t.query(internal.planReminders.findDueBlockReminders, {});
    expect(due).toHaveLength(0);
  });
});
