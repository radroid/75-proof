/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { STANDARD_HABITS } from "./lib/standardHabits";

const modules = import.meta.glob("./**/*.ts");

async function seedUser(t: ReturnType<typeof convexTest>) {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      clerkId: "clerk_start",
      displayName: "Starter",
      preferences: { timezone: "America/New_York", waterUnit: "oz" },
    }),
  );
}

describe("startChallenge", () => {
  test("seeds the standard habit definitions so the earned checklist renders", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);

    const challengeId = await t.mutation(api.challenges.startChallenge, {
      userId,
      startDate: "2026-07-27",
      visibility: "friends",
    });

    const defs = await t.run(async (ctx) =>
      ctx.db
        .query("habitDefinitions")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
        .collect(),
    );

    expect(defs.length).toBe(STANDARD_HABITS.length);
    // All hard, all active — matches the "day earned" contract the dashboard uses.
    expect(defs.every((d) => d.isHard && d.isActive)).toBe(true);
    expect(new Set(defs.map((d) => d.name))).toEqual(
      new Set(STANDARD_HABITS.map((h) => h.name)),
    );

    const challenge = await t.run(async (ctx) => ctx.db.get(challengeId));
    expect(challenge?.templateSlug).toBe("original-75-hard");
  });

  test("honors an explicit templateSlug on the challenge", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const challengeId = await t.mutation(api.challenges.startChallenge, {
      userId,
      startDate: "2026-07-27",
      visibility: "private",
      templateSlug: "custom",
    });
    const challenge = await t.run(async (ctx) => ctx.db.get(challengeId));
    expect(challenge?.templateSlug).toBe("custom");
  });
});

describe("backfillStandardHabitsIfEmpty", () => {
  test("seeds a brand-new challenge that has no habit definitions", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    // Simulate a pre-fix legacy challenge: created with zero habit definitions.
    const challengeId = await t.run(async (ctx) =>
      ctx.db.insert("challenges", {
        userId,
        startDate: "2026-07-27",
        currentDay: 1,
        status: "active",
        visibility: "friends",
        daysTotal: 75,
      }),
    );

    const res = await t.mutation(
      internal.challenges.backfillStandardHabitsIfEmpty,
      { challengeId },
    );
    expect(res.status).toBe("migrated");

    const defs = await t.run(async (ctx) =>
      ctx.db
        .query("habitDefinitions")
        .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
        .collect(),
    );
    expect(defs.length).toBe(STANDARD_HABITS.length);
  });

  test("is a no-op when the challenge already has habit definitions", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const challengeId = await t.mutation(api.challenges.startChallenge, {
      userId,
      startDate: "2026-07-27",
      visibility: "friends",
    });
    const res = await t.mutation(
      internal.challenges.backfillStandardHabitsIfEmpty,
      { challengeId },
    );
    expect(res.status).toBe("already_has_defs");
  });

  test("carries whole-day completion from legacy dailyLogs so the streak is preserved", async () => {
    const t = convexTest(schema, modules);
    const userId = await seedUser(t);
    const challengeId = await t.run(async (ctx) => {
      const cid = await ctx.db.insert("challenges", {
        userId,
        startDate: "2026-06-01",
        currentDay: 3,
        status: "active",
        visibility: "friends",
        daysTotal: 75,
      });
      // Day 1 fully complete, day 2 in-progress (not complete).
      await ctx.db.insert("dailyLogs", {
        challengeId: cid,
        userId,
        dayNumber: 1,
        date: "2026-06-01",
        outdoorWorkoutCompleted: true,
        dietFollowed: true,
        noAlcohol: true,
        waterIntakeOz: 128,
        readingMinutes: 20,
        allRequirementsMet: true,
      });
      await ctx.db.insert("dailyLogs", {
        challengeId: cid,
        userId,
        dayNumber: 2,
        date: "2026-06-02",
        outdoorWorkoutCompleted: false,
        dietFollowed: false,
        noAlcohol: false,
        waterIntakeOz: 0,
        readingMinutes: 0,
        allRequirementsMet: false,
      });
      return cid;
    });

    // Completion map BEFORE migration (legacy path reads allRequirementsMet).
    const before = await t.query(api.challenges.getDayCompletionMap, {
      challengeId,
    });
    expect(before[1]).toBe(true);
    expect(before[2]).toBe(false);

    const res = await t.mutation(
      internal.challenges.backfillStandardHabitsIfEmpty,
      { challengeId },
    );
    expect(res.status).toBe("migrated");
    expect(res.daysCarried).toBe(1);

    // Completion map AFTER migration (new path reads habitEntries) is identical
    // — the streak is preserved.
    const after = await t.query(api.challenges.getDayCompletionMap, {
      challengeId,
    });
    expect(after[1]).toBe(true);
    expect(after[2]).toBe(false);
  });
});
