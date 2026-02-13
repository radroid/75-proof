import { v } from "convex/values";
import { mutation, query, internalMutation, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  getTodayInTimezone,
  computeDayNumber,
  getEditableDays,
} from "./lib/dayCalculation";

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

export const startChallenge = mutation({
  args: {
    userId: v.id("users"),
    startDate: v.string(),
    visibility: v.union(
      v.literal("private"),
      v.literal("friends"),
      v.literal("public")
    ),
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

    // Create new challenge
    const challengeId = await ctx.db.insert("challenges", {
      userId: args.userId,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: args.visibility,
      restartCount: 0,
    });

    // Update user's current challenge
    await ctx.db.patch(args.userId, {
      currentChallengeId: challengeId,
    });

    // Create activity feed entry
    await ctx.db.insert("activityFeed", {
      userId: args.userId,
      type: "challenge_started",
      challengeId,
      message: "Started the 75 HARD challenge!",
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

    if (newDay > 75) {
      // Challenge completed!
      await ctx.db.patch(args.challengeId, {
        currentDay: 75,
        status: "completed",
      });

      // Update longest streak on user record
      const user = await ctx.db.get(challenge.userId);
      const currentLongest = user?.longestStreak ?? 0;
      if (75 > currentLongest) {
        await ctx.db.patch(challenge.userId, { longestStreak: 75 });
      }

      await ctx.db.insert("activityFeed", {
        userId: challenge.userId,
        type: "challenge_completed",
        challengeId: args.challengeId,
        dayNumber: 75,
        message: "Completed the 75 HARD challenge! 🎉",
        createdAt: new Date().toISOString(),
      });
    } else {
      await ctx.db.patch(args.challengeId, {
        currentDay: newDay,
      });

      // Check for milestones
      const milestones = [7, 14, 21, 30, 45, 60];
      if (milestones.includes(newDay - 1)) {
        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "milestone",
          challengeId: args.challengeId,
          dayNumber: newDay - 1,
          message: `Reached Day ${newDay - 1} of 75 HARD!`,
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

    // If challenge hasn't started yet or is day 1-3, no grace periods expired
    const lastExpiredDay = todayDayNumber - 3;
    if (lastExpiredDay < 1) {
      // Sync currentDay
      const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
      if (challenge.currentDay !== syncDay) {
        await ctx.db.patch(args.challengeId, { currentDay: syncDay });
      }
      return { status: "active" };
    }

    // Scan from day 1 to lastExpiredDay for incomplete days
    const upperBound = Math.min(lastExpiredDay, 75);
    for (let day = 1; day <= upperBound; day++) {
      const log = await ctx.db
        .query("dailyLogs")
        .withIndex("by_challenge_day", (q) =>
          q.eq("challengeId", args.challengeId).eq("dayNumber", day)
        )
        .unique();

      if (!log || !log.allRequirementsMet) {
        // This day is incomplete and grace period has expired — fail
        await failChallengeInternal(ctx, args.challengeId, day);
        return { status: "failed", failedOnDay: day };
      }
    }

    // All expired days are complete — check for challenge completion
    if (todayDayNumber > 75) {
      // Verify all 75 days are complete
      let allComplete = true;
      for (let day = upperBound + 1; day <= 75; day++) {
        const log = await ctx.db
          .query("dailyLogs")
          .withIndex("by_challenge_day", (q) =>
            q.eq("challengeId", args.challengeId).eq("dayNumber", day)
          )
          .unique();
        if (!log || !log.allRequirementsMet) {
          allComplete = false;
          break;
        }
      }

      if (allComplete) {
        await ctx.db.patch(args.challengeId, {
          currentDay: 75,
          status: "completed",
        });

        // Update longest streak on user record
        const user = await ctx.db.get(challenge.userId);
        const currentLongest = user?.longestStreak ?? 0;
        if (75 > currentLongest) {
          await ctx.db.patch(challenge.userId, { longestStreak: 75 });
        }

        await ctx.db.insert("activityFeed", {
          userId: challenge.userId,
          type: "challenge_completed",
          challengeId: args.challengeId,
          dayNumber: 75,
          message: "Completed the 75 HARD challenge!",
          createdAt: new Date().toISOString(),
        });
        return { status: "completed" };
      }
    }

    // Sync currentDay
    const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
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

      const lastExpiredDay = todayDayNumber - 3;
      if (lastExpiredDay < 1) {
        // Sync currentDay
        const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
        if (challenge.currentDay !== syncDay) {
          await ctx.db.patch(challenge._id, { currentDay: syncDay });
        }
        continue;
      }

      const upperBound = Math.min(lastExpiredDay, 75);
      let failed = false;
      for (let day = 1; day <= upperBound; day++) {
        const log = await ctx.db
          .query("dailyLogs")
          .withIndex("by_challenge_day", (q) =>
            q.eq("challengeId", challenge._id).eq("dayNumber", day)
          )
          .unique();

        if (!log || !log.allRequirementsMet) {
          await failChallengeInternal(ctx, challenge._id, day);
          failed = true;
          break;
        }
      }

      if (!failed) {
        const syncDay = Math.min(Math.max(todayDayNumber, 1), 75);
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
        const logs = await ctx.db
          .query("dailyLogs")
          .withIndex("by_challenge", (q) => q.eq("challengeId", challenge._id))
          .collect();
        const completedDays = new Set(
          logs.filter((l) => l.allRequirementsMet).map((l) => l.dayNumber)
        );
        // Count consecutive completed days from day 1
        for (let day = 1; day <= challenge.currentDay; day++) {
          if (completedDays.has(day)) {
            currentStreak = day;
          } else {
            break;
          }
        }
      }
    }

    return { lifetimeRestartCount, longestStreak, currentStreak, attemptNumber };
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
