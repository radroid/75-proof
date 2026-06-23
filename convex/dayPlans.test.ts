/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import type { Id } from "./_generated/dataModel";

const modules = import.meta.glob("./**/*.ts");
const DATE = "2026-06-23";

async function seed(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) => {
    const userId = await ctx.db.insert("users", {
      clerkId: "clerk_a",
      displayName: "A",
      preferences: { timezone: "America/New_York", waterUnit: "oz" },
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
    const h1 = await ctx.db.insert("habitDefinitions", {
      challengeId,
      userId,
      name: "Workout",
      blockType: "task",
      isHard: true,
      isActive: true,
      sortOrder: 0,
      category: "fitness",
    });
    const h2 = await ctx.db.insert("habitDefinitions", {
      challengeId,
      userId,
      name: "Reading",
      blockType: "counter",
      target: 20,
      unit: "min",
      isHard: true,
      isActive: true,
      sortOrder: 1,
      category: "mind",
    });
    return { userId, challengeId, h1, h2 };
  });
}

describe("dayPlans backend", () => {
  test("ensureToday is idempotent and getPlanForDay reads it back", async () => {
    const t = convexTest(schema, modules);
    await seed(t);
    const asA = t.withIdentity({ subject: "clerk_a" });

    const id1 = await asA.mutation(api.dayPlans.ensureToday, {
      date: DATE,
      workStart: "09:00",
      workEnd: "17:30",
      windDownAt: "22:00",
    });
    const id2 = await asA.mutation(api.dayPlans.ensureToday, {
      date: DATE,
      workStart: "08:00",
      workEnd: "16:00",
      windDownAt: "21:00",
    });
    expect(id1).toEqual(id2); // idempotent — no second row

    const res = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res.plan?.workStart).toBe("09:00");
    expect(res.plan?.workEnd).toBe("17:30");
    expect(res.blocks).toHaveLength(0);
  });

  test("setWorkHours + saveWorkScheduleDefault persist", async () => {
    const t = convexTest(schema, modules);
    const { userId } = await seed(t);
    const asA = t.withIdentity({ subject: "clerk_a" });

    await asA.mutation(api.dayPlans.setWorkHours, {
      date: DATE,
      workStart: "10:00",
      workEnd: "18:00",
      windDownAt: "23:00",
    });
    const res = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res.plan?.workStart).toBe("10:00");
    expect(res.plan?.windDownAt).toBe("23:00");

    await asA.mutation(api.dayPlans.saveWorkScheduleDefault, {
      workSchedule: {
        defaultStart: "09:00",
        defaultEnd: "17:00",
        windDownAt: "22:30",
        workdays: [1, 2, 3, 4, 5],
      },
    });
    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.preferences.workSchedule?.defaultStart).toBe("09:00");
    expect(res.workSchedule).toBeNull(); // earlier snapshot had none
  });

  test("replacePlannedBlocks sets and resorts blocks", async () => {
    const t = convexTest(schema, modules);
    const { h1, h2 } = await seed(t);
    const asA = t.withIdentity({ subject: "clerk_a" });

    await asA.mutation(api.dayPlans.replacePlannedBlocks, {
      date: DATE,
      workStart: "09:00",
      workEnd: "17:30",
      windDownAt: "22:00",
      blocks: [
        { habitDefinitionId: h2, kind: "habit", startMin: 1200, durationMin: 20, reminderEnabled: true },
        { habitDefinitionId: h1, kind: "habit", startMin: 1065, durationMin: 45, reminderEnabled: false },
      ],
    });

    const res = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res.blocks.map((b) => b.startMin)).toEqual([1065, 1200]); // sorted
    expect(res.blocks[0].habitDefinitionId).toBe(h1);

    // Replacing again clears the old set.
    await asA.mutation(api.dayPlans.replacePlannedBlocks, {
      date: DATE,
      workStart: "09:00",
      workEnd: "17:30",
      windDownAt: "22:00",
      blocks: [
        { habitDefinitionId: h1, kind: "habit", startMin: 1100, durationMin: 45, reminderEnabled: false },
      ],
    });
    const res2 = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res2.blocks).toHaveLength(1);
    expect(res2.blocks[0].startMin).toBe(1100);
  });

  test("move/resize/remove/reminder block lifecycle", async () => {
    const t = convexTest(schema, modules);
    const { h1 } = await seed(t);
    const asA = t.withIdentity({ subject: "clerk_a" });

    const blockId = (await asA.mutation(api.dayPlans.addBlock, {
      date: DATE,
      workStart: "09:00",
      workEnd: "17:30",
      windDownAt: "22:00",
      block: { habitDefinitionId: h1, kind: "habit", startMin: 1065, durationMin: 45, reminderEnabled: true },
    })) as Id<"planBlocks">;

    await asA.mutation(api.dayPlans.moveBlock, { blockId, startMin: 1140 });
    await asA.mutation(api.dayPlans.resizeBlock, { blockId, startMin: 1140, durationMin: 30 });
    let res = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res.blocks[0].startMin).toBe(1140);
    expect(res.blocks[0].durationMin).toBe(30);

    await asA.mutation(api.dayPlans.setBlockReminder, { blockId, enabled: false });
    res = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res.blocks[0].reminderEnabled).toBe(false);

    await asA.mutation(api.dayPlans.removeBlock, { blockId });
    res = await asA.query(api.dayPlans.getPlanForDay, { date: DATE });
    expect(res.blocks).toHaveLength(0);
  });

  test("habit placement + duration persist", async () => {
    const t = convexTest(schema, modules);
    const { h1 } = await seed(t);
    const asA = t.withIdentity({ subject: "clerk_a" });

    await asA.mutation(api.dayPlans.setHabitPlacement, {
      habitDefinitionId: h1,
      placement: "anytime",
    });
    await asA.mutation(api.dayPlans.setHabitDuration, {
      habitDefinitionId: h1,
      estimatedMinutes: 9999, // clamped to 240
    });
    const habit = await t.run((ctx) => ctx.db.get(h1));
    expect(habit?.defaultPlacement).toBe("anytime");
    expect(habit?.estimatedMinutes).toBe(240);
  });

  test("a user cannot mutate another user's block", async () => {
    const t = convexTest(schema, modules);
    const { h1 } = await seed(t);
    const asA = t.withIdentity({ subject: "clerk_a" });
    const blockId = (await asA.mutation(api.dayPlans.addBlock, {
      date: DATE,
      workStart: "09:00",
      workEnd: "17:30",
      windDownAt: "22:00",
      block: { habitDefinitionId: h1, kind: "habit", startMin: 1065, durationMin: 45, reminderEnabled: true },
    })) as Id<"planBlocks">;

    // Second user.
    await t.run(async (ctx) => {
      await ctx.db.insert("users", {
        clerkId: "clerk_b",
        displayName: "B",
        preferences: { timezone: "UTC", waterUnit: "oz" },
      });
    });
    const asB = t.withIdentity({ subject: "clerk_b" });
    await expect(
      asB.mutation(api.dayPlans.moveBlock, { blockId, startMin: 600 }),
    ).rejects.toThrow();
  });
});
