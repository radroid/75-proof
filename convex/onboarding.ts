import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const habitValidator = v.object({
  name: v.string(),
  blockType: v.union(v.literal("task"), v.literal("counter")),
  target: v.optional(v.number()),
  unit: v.optional(v.string()),
  isHard: v.boolean(),
  isActive: v.boolean(),
  category: v.string(),
  sortOrder: v.number(),
  icon: v.optional(v.string()),
});

export const completeOnboarding = mutation({
  args: {
    // Profile
    displayName: v.string(),
    timezone: v.string(),
    ageRange: v.optional(v.string()),
    healthConditions: v.optional(v.array(v.string())),
    healthAdvisoryAcknowledged: v.boolean(),
    goals: v.optional(v.array(v.string())),

    // Challenge setup
    setupTier: v.union(v.literal("original"), v.literal("customized"), v.literal("added")),
    habits: v.array(habitValidator),
    startDate: v.string(),
    visibility: v.union(v.literal("private"), v.literal("friends"), v.literal("public")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Check no active challenge
    if (user.currentChallengeId) {
      const existing = await ctx.db.get(user.currentChallengeId);
      if (existing && existing.status === "active") {
        throw new Error("User already has an active challenge");
      }
    }

    // Create challenge
    const challengeId = await ctx.db.insert("challenges", {
      userId: user._id,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: args.visibility,
      restartCount: 0,
      setupTier: args.setupTier,
    });

    // Insert all habit definitions
    for (const habit of args.habits) {
      await ctx.db.insert("habitDefinitions", {
        challengeId,
        userId: user._id,
        name: habit.name,
        blockType: habit.blockType,
        target: habit.target,
        unit: habit.unit,
        isHard: habit.isHard,
        isActive: habit.isActive,
        sortOrder: habit.sortOrder,
        category: habit.category,
        icon: habit.icon,
      });
    }

    // Update user profile + onboarding data
    await ctx.db.patch(user._id, {
      displayName: args.displayName,
      currentChallengeId: challengeId,
      onboardingComplete: true,
      onboarding: {
        completedAt: new Date().toISOString(),
        ageRange: args.ageRange,
        healthConditions: args.healthConditions,
        goals: args.goals,
        healthAdvisoryAcknowledged: args.healthAdvisoryAcknowledged,
        setupTier: args.setupTier,
      },
      preferences: {
        ...user.preferences,
        timezone: args.timezone,
      },
    });

    // Create activity feed entry
    await ctx.db.insert("activityFeed", {
      userId: user._id,
      type: "challenge_started",
      challengeId,
      message: "Started the 75 HARD challenge!",
      createdAt: new Date().toISOString(),
    });

    return challengeId;
  },
});

/**
 * Returns previous onboarding state for re-onboarding pre-population.
 * Built from user profile data + habit definitions from the most recent failed challenge.
 */
export const getPreviousOnboardingState = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user || !user.onboarding) return null;

    // Find the most recent failed challenge to get habit definitions
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();

    const latestFailed = challenges
      .filter((c) => c.status === "failed")
      .sort((a, b) => (b._creationTime ?? 0) - (a._creationTime ?? 0))[0];

    let habits: Array<{
      name: string;
      blockType: "task" | "counter";
      target?: number;
      unit?: string;
      isHard: boolean;
      isActive: boolean;
      category: string;
      sortOrder: number;
      icon?: string;
    }> = [];

    if (latestFailed) {
      const habitDefs = await ctx.db
        .query("habitDefinitions")
        .withIndex("by_challenge", (q) => q.eq("challengeId", latestFailed._id))
        .collect();

      habits = habitDefs.map((h) => ({
        name: h.name,
        blockType: h.blockType,
        target: h.target,
        unit: h.unit,
        isHard: h.isHard,
        isActive: h.isActive,
        category: h.category ?? "",
        sortOrder: h.sortOrder,
        icon: h.icon,
      }));
    }

    return {
      displayName: user.displayName,
      timezone: user.preferences?.timezone ?? "America/New_York",
      ageRange: user.onboarding.ageRange ?? null,
      healthConditions: user.onboarding.healthConditions ?? [],
      healthAdvisoryAcknowledged: user.onboarding.healthAdvisoryAcknowledged,
      goals: user.onboarding.goals ?? [],
      setupTier: user.onboarding.setupTier,
      habits,
    };
  },
});
