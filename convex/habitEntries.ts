import { v, ConvexError } from "convex/values";
import { mutation, query } from "./_generated/server";
import {
  getTodayInTimezone,
  computeDayNumber,
  isDayEditable,
} from "./lib/dayCalculation";

export const getEntriesForDay = query({
  args: {
    challengeId: v.id("challenges"),
    dayNumber: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitEntries")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .collect();
  },
});

export const toggleTaskEntry = mutation({
  args: {
    habitDefinitionId: v.id("habitDefinitions"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    dayNumber: v.number(),
    date: v.string(),
    userTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate edit window
    if (args.userTimezone) {
      const challenge = await ctx.db.get(args.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      const todayStr = getTodayInTimezone(args.userTimezone);
      const todayDay = computeDayNumber(challenge.startDate, todayStr);
      if (!isDayEditable(args.dayNumber, todayDay)) {
        throw new ConvexError({
          code: "EDIT_WINDOW_CLOSED",
          message: `Day ${args.dayNumber} is no longer editable.`,
        });
      }
    }

    // Find existing entry
    const existing = await ctx.db
      .query("habitEntries")
      .withIndex("by_habit_day", (q) =>
        q.eq("habitDefinitionId", args.habitDefinitionId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { completed: !existing.completed });
      return existing._id;
    } else {
      return await ctx.db.insert("habitEntries", {
        habitDefinitionId: args.habitDefinitionId,
        challengeId: args.challengeId,
        userId: args.userId,
        dayNumber: args.dayNumber,
        date: args.date,
        completed: true,
      });
    }
  },
});

export const updateCounterEntry = mutation({
  args: {
    habitDefinitionId: v.id("habitDefinitions"),
    challengeId: v.id("challenges"),
    userId: v.id("users"),
    dayNumber: v.number(),
    date: v.string(),
    value: v.number(),
    userTimezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate edit window
    if (args.userTimezone) {
      const challenge = await ctx.db.get(args.challengeId);
      if (!challenge) throw new Error("Challenge not found");
      const todayStr = getTodayInTimezone(args.userTimezone);
      const todayDay = computeDayNumber(challenge.startDate, todayStr);
      if (!isDayEditable(args.dayNumber, todayDay)) {
        throw new ConvexError({
          code: "EDIT_WINDOW_CLOSED",
          message: `Day ${args.dayNumber} is no longer editable.`,
        });
      }
    }

    // Get the habit definition to check target
    const habitDef = await ctx.db.get(args.habitDefinitionId);
    if (!habitDef) throw new Error("Habit definition not found");

    const completed = habitDef.target ? args.value >= habitDef.target : false;

    const existing = await ctx.db
      .query("habitEntries")
      .withIndex("by_habit_day", (q) =>
        q.eq("habitDefinitionId", args.habitDefinitionId).eq("dayNumber", args.dayNumber)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, completed });
      return existing._id;
    } else {
      return await ctx.db.insert("habitEntries", {
        habitDefinitionId: args.habitDefinitionId,
        challengeId: args.challengeId,
        userId: args.userId,
        dayNumber: args.dayNumber,
        date: args.date,
        value: args.value,
        completed,
      });
    }
  },
});

export const markDayComplete = mutation({
  args: {
    challengeId: v.id("challenges"),
    dayNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify the challenge belongs to the caller
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.userId !== user._id) {
      throw new Error("Challenge not found");
    }

    // Verify all hard habits are complete
    const habits = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    const hardHabits = habits.filter((h) => h.isActive && h.isHard);

    const entries = await ctx.db
      .query("habitEntries")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .collect();

    const entryMap = new Map(entries.map((e) => [String(e.habitDefinitionId), e]));

    for (const habit of hardHabits) {
      const entry = entryMap.get(String(habit._id));
      if (!entry || !entry.completed) {
        throw new Error("Not all hard habits are complete");
      }
    }

    // Deduplication: check if we already posted a day_completed for this day
    const existingFeedItems = await ctx.db
      .query("activityFeed")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "day_completed"),
          q.eq(q.field("challengeId"), args.challengeId),
          q.eq(q.field("dayNumber"), args.dayNumber)
        )
      )
      .unique();

    if (existingFeedItems) {
      return existingFeedItems._id;
    }

    // Insert activity feed item
    return await ctx.db.insert("activityFeed", {
      userId: user._id,
      type: "day_completed",
      challengeId: args.challengeId,
      dayNumber: args.dayNumber,
      message: `Completed Day ${args.dayNumber} of 75!`,
      createdAt: new Date().toISOString(),
    });
  },
});

export const checkDayComplete = query({
  args: {
    challengeId: v.id("challenges"),
    dayNumber: v.number(),
  },
  handler: async (ctx, args) => {
    // Get all active hard habit definitions
    const habits = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    const hardHabits = habits.filter((h) => h.isActive && h.isHard);

    if (hardHabits.length === 0) return true;

    // Get entries for this day
    const entries = await ctx.db
      .query("habitEntries")
      .withIndex("by_challenge_day", (q) =>
        q.eq("challengeId", args.challengeId).eq("dayNumber", args.dayNumber)
      )
      .collect();

    const entryMap = new Map(entries.map((e) => [e.habitDefinitionId, e]));

    for (const habit of hardHabits) {
      const entry = entryMap.get(habit._id);
      if (!entry || !entry.completed) return false;
    }
    return true;
  },
});
