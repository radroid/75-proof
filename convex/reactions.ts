import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser, getAuthenticatedUserOrNull } from "./lib/auth";
import { Id } from "./_generated/dataModel";

const emojiValidator = v.union(
  v.literal("fire"),
  v.literal("muscle"),
  v.literal("clap"),
  v.literal("heart")
);

export const toggleReaction = mutation({
  args: {
    activityId: v.id("activityFeed"),
    emoji: emojiValidator,
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const existing = await ctx.db
      .query("feedReactions")
      .withIndex("by_activity_user_emoji", (q) =>
        q
          .eq("activityId", args.activityId)
          .eq("userId", user._id)
          .eq("emoji", args.emoji)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { reacted: false };
    }

    await ctx.db.insert("feedReactions", {
      activityId: args.activityId,
      userId: user._id,
      emoji: args.emoji,
      createdAt: new Date().toISOString(),
    });
    return { reacted: true };
  },
});

export type ReactionSummary = {
  emoji: "fire" | "muscle" | "clap" | "heart";
  count: number;
  reacted: boolean;
};

export const getReactionsForActivities = query({
  args: { activityIds: v.array(v.id("activityFeed")) },
  handler: async (ctx, args): Promise<Record<string, ReactionSummary[]>> => {
    const user = await getAuthenticatedUserOrNull(ctx);
    const result: Record<string, ReactionSummary[]> = {};

    for (const activityId of args.activityIds) {
      const rows = await ctx.db
        .query("feedReactions")
        .withIndex("by_activity", (q) => q.eq("activityId", activityId))
        .take(500);

      const counts = new Map<string, number>();
      const mine = new Set<string>();
      for (const r of rows) {
        counts.set(r.emoji, (counts.get(r.emoji) ?? 0) + 1);
        if (user && String(r.userId) === String(user._id)) mine.add(r.emoji);
      }

      const summary: ReactionSummary[] = [];
      for (const [emoji, count] of counts) {
        summary.push({
          emoji: emoji as ReactionSummary["emoji"],
          count,
          reacted: mine.has(emoji),
        });
      }
      result[String(activityId)] = summary;
    }

    return result;
  },
});
