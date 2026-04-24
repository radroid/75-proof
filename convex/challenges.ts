import { v } from "convex/values";
import { mutation, query, internalMutation, MutationCtx, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getTodayInTimezone,
  computeDayNumber,
  getEditableDays,
  effectiveDaysTotal,
} from "./lib/dayCalculation";

/**
 * Shared helper: check if a day is complete for a challenge.
 * Detects which system the challenge uses (legacy dailyLogs vs new habitEntries).
 */
async function isDayCompleteForChallenge(
  ctx: MutationCtx,
  challengeId: Id<"challenges">,
  dayNumber: number
): Promise<boolean> {
  // Check if challenge uses the new habit system
  const habitDefs = await ctx.db
    .query("habitDefinitions")
    .withIndex("by_challenge", (q) => q.eq("challengeId", challengeId))
    .collect();

  if (habitDefs.length > 0) {
    // New system: check all active hard habits have completed entries
    const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
    if (hardHabits.length === 0) return true;

    const entries = await ctx.db
      .query("habitEntries")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", challengeId).eq("dayNumber", dayNumber)
      )
      .collect();
    const entryMap = new Map(entries.map((e) => [e.habitDefinitionId, e]));

    for (const habit of hardHabits) {
      const entry = entryMap.get(habit._id);
      if (!entry || !entry.completed) return false;
    }
    return true;
  }

  // Legacy system: check dailyLogs
  const log = await ctx.db
    .query("dailyLogs")
    .withIndex("by_challenge_day", (q) =>
      q.eq("challengeId", challengeId).eq("dayNumber", dayNumber)
    )
    .unique();

  return !!log?.allRequirementsMet;
}

export const getActiveChallenge = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();
  },
});

export const getChallenge = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.challengeId);
  },
});

export const getUserChallenges = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Per-day completion map for a challenge. Hard habits are required; soft habits
// are optional. Falls back to legacy `dailyLogs.allRequirementsMet` when the
// challenge has no habit definitions.
export const getDayCompletionMap = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return {} as Record<number, boolean>;

    const habitDefs = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    const result: Record<number, boolean> = {};

    if (habitDefs.length > 0) {
      const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
      const entries = await ctx.db
        .query("habitEntries")
        .withIndex("by_challenge_day", (q) => q.eq("challengeId", args.challengeId))
        .collect();

      const entriesByDay = new Map<number, Map<string, typeof entries[number]>>();
      for (const e of entries) {
        let byHabit = entriesByDay.get(e.dayNumber);
        if (!byHabit) {
          byHabit = new Map();
          entriesByDay.set(e.dayNumber, byHabit);
        }
        byHabit.set(String(e.habitDefinitionId), e);
      }

      for (let day = 1; day <= challenge.currentDay; day++) {
        if (hardHabits.length === 0) {
          result[day] = false;
          continue;
        }
        const byHabit = entriesByDay.get(day);
        const complete = !!byHabit && hardHabits.every((h) => {
          const entry = byHabit.get(String(h._id));
          return !!entry?.completed;
        });
        result[day] = complete;
      }
      return result;
    }

    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge_day", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    for (const log of logs) {
      result[log.dayNumber] = !!log.allRequirementsMet;
    }
    return result;
  },
});

export const startChallenge = mutation({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
    daysTotal: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if user already has an active challenge
    const existingChallenge = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .unique();

    if (existingChallenge) {
      throw new Error("User already has an active challenge");
    }

    const daysTotal = args.daysTotal ?? 75;

    // Create new challenge
    const challengeId = await ctx.db.insert("challenges", {
      userId: args.userId,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: args.visibility,
      restartCount: 0,
      daysTotal,
    });

    // Update user's current challenge
    await ctx.db.patch(args.userId, {
      currentChallengeId: challengeId,
    });

    const startMessage =
      daysTotal === 75
        ? "Started the 75 HARD challenge!"
        : `Started a ${daysTotal}-day challenge!`;
    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      type: "challenge_started",
      challengeId,
      message: startMessage,
      createdAt: new Date().toISOString(),
    });

    return challengeId;
  },
});

export const advanceDay = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    if (challenge.status !== "active") {
      throw new Error("Challenge is not active");
    }

    const newDay = challenge.currentDay + 1;
    const daysTotal = effectiveDaysTotal(challenge); // null = habit-tracker mode

    if (daysTotal !== null && newDay > daysTotal) {
      // Challenge completed!
      await ctx.db.patch(args.challengeId, {
        currentDay: daysTotal,
        status: "completed",
      });

      // Update longest streak on user record
      const user = await ctx.db.get(challenge.userId);
      const currentLongest = user?.longestStreak ?? 0;
      if (daysTotal > currentLongest) {
        await ctx.db.patch(challenge.userId, { longestStreak: daysTotal });
      }

      const completionMessage =
        daysTotal === 75
          ? "Completed the 75 HARD challenge! 🎉"
          : `Completed the ${daysTotal}-day challenge! 🎉`;
      await ctx.db.insert("activityFeed", {
        userId: challenge.userId,
        type: "challenge_completed",
        challengeId: args.challengeId,
        dayNumber: daysTotal,
        message: completionMessage,
        createdAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.patch(args.challengeId, {
        currentDay: newDay,
      });

      // Check for milestones
      const milestones = [7, 14, 21, 30, 45, 60];
      if (milestones.includes(newDay - 1)) {
        const milestoneSuffix =
          daysTotal === 75 ? "of 75 HARD" : daysTotal !== null ? `of ${daysTotal}` : "";
        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "milestone",
          challengeId: args.challengeId,
          dayNumber: newDay - 1,
          message: `Reached Day ${newDay - 1}${milestoneSuffix ? " " + milestoneSuffix : ""}!`,
          createdAt: new Date().toISOString(),
        });
      }
    }
  },
});

export const failChallenge = mutation({
  args: {
    challengeId: v.id("challenges"),
    failedOnDay: v.number(),
  },
  handler: async (ctx, args) => {
    await failChallengeInternal(ctx, args.challengeId, args.failedOnDay);
  },
});

/** Shared helper: fail a challenge and clean up. Used by both the public mutation and auto-reset. */
async function failChallengeInternal(
  ctx: MutationCtx,
  challengeId: Id<"challenges">,
  failedOnDay: number
) {
  const challenge = await ctx.db.get(challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  await ctx.db.patch(challengeId, {
    status: "failed",
    failedOnDay,
    restartCount: (challenge.restartCount ?? 0) + 1,
  });

  // Update lifetime stats on user record
  const user = await ctx.db.get(challenge.userId);
  const streakFromAttempt = Math.max(failedOnDay - 1, 0);
  const currentLongest = user?.longestStreak ?? 0;
  await ctx.db.patch(challenge.userId, {
    currentChallengeId: undefined,
    lifetimeRestartCount: (user?.lifetimeRestartCount ?? 0) + 1,
    longestStreak: Math.max(currentLongest, streakFromAttempt),
  });

  await ctx.db.insert("activityFeed", {
    userId: challenge.userId,
    type: "challenge_failed",
    challengeId,
    dayNumber: failedOnDay,
    message: `Challenge ended on Day ${failedOnDay}. Ready to start again!`,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Lazy-eval challenge status check. Called on client visit.
 * Scans expired-grace days, triggers auto-reset or syncs currentDay.
 * Returns { status, failedOnDay? } so the client can react.
 */
export const checkChallengeStatus = mutation({
  args: {
    challengeId: v.id("challenges"),
    userTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "active") {
      return { status: challenge?.status ?? "not_found" };
    }

    const todayStr = getTodayInTimezone(args.userTimezone);
    const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);
    const daysTotal = effectiveDaysTotal(challenge); // null = habit-tracker mode
    // Cap currentDay at the configured total when bounded; let it grow
    // unbounded in habit-tracker mode.
    const cap = (n: number) => (daysTotal === null ? n : Math.min(n, daysTotal));

    // If challenge hasn't started yet or is day 1-3, no grace periods expired
    const lastExpiredDay = todayDayNumber - 3;
    if (lastExpiredDay < 1) {
      // Sync currentDay
      const syncDay = cap(Math.max(todayDayNumber, 1));
      if (challenge.currentDay !== syncDay) {
        await ctx.db.patch(args.challengeId, { currentDay: syncDay });
      }
      return { status: "active" };
    }

    // Scan from day 1 to lastExpiredDay for incomplete days. In habit-tracker
    // mode there is no upper limit; otherwise cap at daysTotal.
    const scanCeiling = daysTotal === null ? lastExpiredDay : Math.min(lastExpiredDay, daysTotal);
    for (let day = 1; day <= scanCeiling; day++) {
      const complete = await isDayCompleteForChallenge(ctx, args.challengeId, day);
      if (!complete) {
        // This day is incomplete and grace period has expired — fail
        await failChallengeInternal(ctx, args.challengeId, day);
        return { status: "failed", failedOnDay: day };
      }
    }

    // All expired days are complete — check for challenge completion. In
    // habit-tracker mode the challenge never completes; just sync forward.
    if (daysTotal !== null && todayDayNumber > daysTotal) {
      // Verify all daysTotal days are complete
      let allComplete = true;
      for (let day = scanCeiling + 1; day <= daysTotal; day++) {
        const complete = await isDayCompleteForChallenge(ctx, args.challengeId, day);
        if (!complete) {
          allComplete = false;
          break;
        }
      }

      if (allComplete) {
        await ctx.db.patch(args.challengeId, {
          currentDay: daysTotal,
          status: "completed",
        });

        // Update longest streak on user record
        const user = await ctx.db.get(challenge.userId);
        const currentLongest = user?.longestStreak ?? 0;
        if (daysTotal > currentLongest) {
          await ctx.db.patch(challenge.userId, { longestStreak: daysTotal });
        }

        const completionMessage =
          daysTotal === 75
            ? "Completed the 75 HARD challenge!"
            : `Completed the ${daysTotal}-day challenge!`;
        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "challenge_completed",
          challengeId: args.challengeId,
          dayNumber: daysTotal,
          message: completionMessage,
          createdAt: new Date().toISOString(),
        });
        return { status: "completed" };
      }
    }

    // Sync currentDay
    const syncDay = cap(Math.max(todayDayNumber, 1));
    if (challenge.currentDay !== syncDay) {
      await ctx.db.patch(args.challengeId, { currentDay: syncDay });
    }

    return { status: "active" };
  },
});

/** Cron-callable: check all active challenges using UTC as fallback timezone. */
export const checkAllActiveChallenges = internalMutation({
  args: {},
  handler: async (ctx) => {
    const activeChallenges = await ctx.db
      .query("challenges")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    for (const challenge of activeChallenges) {
      // Look up user's timezone preference
      const user = await ctx.db.get(challenge.userId);
      const tz = user?.preferences?.timezone ?? "UTC";

      const todayStr = getTodayInTimezone(tz);
      const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);
      const daysTotal = effectiveDaysTotal(challenge);
      const cap = (n: number) => (daysTotal === null ? n : Math.min(n, daysTotal));

      const lastExpiredDay = todayDayNumber - 3;
      if (lastExpiredDay < 1) {
        // Sync currentDay
        const syncDay = cap(Math.max(todayDayNumber, 1));
        if (challenge.currentDay !== syncDay) {
          await ctx.db.patch(challenge._id, { currentDay: syncDay });
        }
        continue;
      }

      const upperBound =
        daysTotal === null ? lastExpiredDay : Math.min(lastExpiredDay, daysTotal);
      let failed = false;
      for (let day = 1; day <= upperBound; day++) {
        const complete = await isDayCompleteForChallenge(ctx, challenge._id, day);
        if (!complete) {
          await failChallengeInternal(ctx, challenge._id, day);
          failed = true;
          break;
        }
      }

      if (!failed) {
        const syncDay = cap(Math.max(todayDayNumber, 1));
        if (challenge.currentDay !== syncDay) {
          await ctx.db.patch(challenge._id, { currentDay: syncDay });
        }
      }
    }
  },
});

/** Query: return editable day numbers for the client's current day. */
export const getEditableWindow = query({
  args: {
    challengeId: v.id("challenges"),
    userTimezone: v.string(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) return [];

    const todayStr = getTodayInTimezone(args.userTimezone);
    const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);
    return getEditableDays(todayDayNumber);
  },
});

export const getLifetimeStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return { lifetimeRestartCount: 0, longestStreak: 0, currentStreak: 0, attemptNumber: 1 };
    }

    const lifetimeRestartCount = user.lifetimeRestartCount ?? 0;
    const longestStreak = user.longestStreak ?? 0;
    const attemptNumber = lifetimeRestartCount + 1;

    // Compute current streak from active challenge
    let currentStreak = 0;
    if (user.currentChallengeId) {
      const challenge = await ctx.db.get(user.currentChallengeId);
      if (challenge && challenge.status === "active") {
        // Check if challenge uses the new habit system
        const habitDefs = await ctx.db
          .query("habitDefinitions")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();

        if (habitDefs.length > 0) {
          // New system: check habitEntries
          const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);
          for (let day = 1; day <= challenge.currentDay; day++) {
            const entries = await ctx.db
              .query("habitEntries")
              .withIndex("by_challenge_day", (q) =>
                q.eq("challengeId", challenge._id).eq("dayNumber", day)
              )
              .collect();
            const entryMap = new Map(entries.map((e) => [e.habitDefinitionId, e]));
            const dayComplete = hardHabits.every((h) => {
              const entry = entryMap.get(h._id);
              return entry?.completed;
            });
            if (dayComplete) {
              currentStreak = day;
            } else {
              break;
            }
          }
        } else {
          // Legacy system: check dailyLogs
          const logs = await ctx.db
            .query("dailyLogs")
            .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
            .collect();
          const completedDays = new Set(
            logs.filter((l) => l.allRequirementsMet).map((l) => l.dayNumber)
          );
          for (let day = 1; day <= challenge.currentDay; day++) {
            if (completedDays.has(day)) {
              currentStreak = day;
            } else {
              break;
            }
          }
        }
      }
    }

    return { lifetimeRestartCount, longestStreak, currentStreak, attemptNumber };
  },
});

export const resetAndReOnboard = mutation({
  args: {
    challengeId: v.id("challenges"),
    failedOnDay: v.number(),
  },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Fail the current challenge (preserves lifetimeRestartCount, longestStreak, history)
    await failChallengeInternal(ctx, args.challengeId, args.failedOnDay);

    // Set onboardingComplete = false so they're routed back to /onboarding
    // Keep hasSeenTutorial = true so the tutorial auto-skips
    await ctx.db.patch(challenge.userId, {
      onboardingComplete: false,
    });
  },
});

/**
 * Reset progress while keeping the existing habit setup. Fails the current
 * challenge, then starts a fresh one from day 1 with the same visibility,
 * setupTier, and habit definitions copied over. Leaves `onboardingComplete`
 * as true so the user lands directly on the dashboard — no onboarding walk.
 */
export const resetKeepingSetup = mutation({
  args: {
    challengeId: v.id("challenges"),
    failedOnDay: v.number(),
    startDate: v.string(),
  },
  handler: async (ctx, args) => {
    const oldChallenge = await ctx.db.get(args.challengeId);
    if (!oldChallenge) throw new Error("Challenge not found");

    // Snapshot habit definitions before failing (fail doesn't touch them,
    // but doing the read first keeps the data flow linear and obvious).
    const oldHabits = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();

    await failChallengeInternal(ctx, args.challengeId, args.failedOnDay);

    const carriedDaysTotal = oldChallenge.daysTotal ?? 75;
    const carriedIsHabitTracker = oldChallenge.isHabitTracker;

    const newChallengeId = await ctx.db.insert("challenges", {
      userId: oldChallenge.userId,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: oldChallenge.visibility,
      restartCount: 0,
      setupTier: oldChallenge.setupTier,
      daysTotal: carriedDaysTotal,
      isHabitTracker: carriedIsHabitTracker,
    });

    for (const h of oldHabits) {
      await ctx.db.insert("habitDefinitions", {
        challengeId: newChallengeId,
        userId: h.userId,
        name: h.name,
        blockType: h.blockType,
        target: h.target,
        unit: h.unit,
        isHard: h.isHard,
        isActive: h.isActive,
        sortOrder: h.sortOrder,
        category: h.category,
        icon: h.icon,
      });
    }

    await ctx.db.patch(oldChallenge.userId, {
      currentChallengeId: newChallengeId,
    });

    const startMessage = carriedIsHabitTracker
      ? "Started a fresh habit tracker!"
      : carriedDaysTotal === 75
        ? "Started the 75 HARD challenge!"
        : `Started a ${carriedDaysTotal}-day challenge!`;
    await ctx.db.insert("activityFeed", {
      userId: oldChallenge.userId,
      type: "challenge_started",
      challengeId: newChallengeId,
      message: startMessage,
      createdAt: new Date().toISOString(),
    });

    return newChallengeId;
  },
});

export const updateVisibility = mutation({
  args: {
    challengeId: v.id("challenges"),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.challengeId, {
      visibility: args.visibility,
    });
  },
});

/**
 * Extend the active challenge length. Length can only increase — shrinking
 * past completed days would invalidate already-finished work, so we reject it.
 */
export const updateChallengeDuration = mutation({
  args: {
    challengeId: v.id("challenges"),
    newDaysTotal: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    const user = await ctx.db.get(challenge.userId);
    if (!user || user.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }

    if (challenge.isHabitTracker) {
      throw new Error("Habit-tracker mode has no duration to extend");
    }
    if (args.newDaysTotal > 365) {
      throw new Error("Challenge length cannot exceed 365 days");
    }
    const currentTotal = challenge.daysTotal ?? 75;
    if (args.newDaysTotal <= currentTotal) {
      throw new Error("Challenge length can only be increased");
    }
    if (args.newDaysTotal < challenge.currentDay) {
      throw new Error("New length must be at least the current day");
    }

    await ctx.db.patch(args.challengeId, { daysTotal: args.newDaysTotal });

    // If the challenge was previously completed (e.g. user finished the
    // original target and now wants more days), reactivate it.
    if (challenge.status === "completed") {
      await ctx.db.patch(args.challengeId, { status: "active" });
      await ctx.db.patch(challenge.userId, { currentChallengeId: args.challengeId });
    }

    await ctx.db.insert("activityFeed", {
      userId: challenge.userId,
      type: "milestone",
      challengeId: args.challengeId,
      dayNumber: challenge.currentDay,
      message: `Extended challenge to ${args.newDaysTotal} days`,
      createdAt: new Date().toISOString(),
    });
  },
});

/**
 * Begin re-onboarding after a completed challenge. Unlike resetAndReOnboard
 * (which is for failures and marks the challenge as "failed"), this preserves
 * the "completed" status — the user actually finished — and only clears the
 * onboarding flag so the page lets them through.
 */
export const startNewChallengeAfterCompletion = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    const user = await ctx.db.get(challenge.userId);
    if (!user || user.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }
    if (challenge.status !== "completed") {
      throw new Error("Challenge is not completed");
    }

    await ctx.db.patch(challenge.userId, {
      onboardingComplete: false,
      currentChallengeId: undefined,
    });
  },
});

/**
 * Convert the active (or just-completed) challenge into an endless habit
 * tracker. The challenge keeps its existing currentDay and habit definitions
 * but no longer has an end date — completion logic stops firing entirely.
 * One-way: there's no UI to convert back in v1.
 */
export const convertToHabitTracker = mutation({
  args: {
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    const user = await ctx.db.get(challenge.userId);
    if (!user || user.clerkId !== identity.subject) {
      throw new Error("Not authorized");
    }

    if (challenge.isHabitTracker) {
      // Already a habit tracker — no-op.
      return;
    }

    await ctx.db.patch(args.challengeId, {
      isHabitTracker: true,
      status: "active",
    });

    // Make sure the user's pointer reflects this challenge as the active one
    // (it might have been cleared when the challenge previously failed or
    // completed).
    if (user.currentChallengeId !== args.challengeId) {
      await ctx.db.patch(challenge.userId, { currentChallengeId: args.challengeId });
    }

    await ctx.db.insert("activityFeed", {
      userId: challenge.userId,
      type: "milestone",
      challengeId: args.challengeId,
      dayNumber: challenge.currentDay,
      message: "Converted to habit tracker — no end date",
      createdAt: new Date().toISOString(),
    });
  },
});
