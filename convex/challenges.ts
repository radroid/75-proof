import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) {
      throw new Error("Challenge not found");
    }

    await ctx.db.patch(args.challengeId, {
      status: "failed",
      failedOnDay: args.failedOnDay,
    });

    // Clear user's current challenge
    await ctx.db.patch(challenge.userId, {
      currentChallengeId: undefined,
    });

    await ctx.db.insert("activityFeed", {
      userId: challenge.userId,
      type: "challenge_failed",
      challengeId: args.challengeId,
      dayNumber: args.failedOnDay,
      message: `Challenge ended on Day ${args.failedOnDay}. Ready to start again!`,
      createdAt: new Date().toISOString(),
    });
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
