import { v } from "convex/values";
import { query } from "./_generated/server";

export const getHabitDefinitions = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
  },
});

export const getActiveHabitDefinitions = query({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("habitDefinitions")
      .withIndex("by_challenge", (q) => q.eq("challengeId", args.challengeId))
      .collect();
    return all
      .filter((h) => h.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
});
