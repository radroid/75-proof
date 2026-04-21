import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthenticatedUser, getAuthenticatedUserOrNull } from "./lib/auth";

const MAX_EMOJI_LEN = 16;
// Notification body cap — push services silently truncate far-longer
// strings anyway, but a tight ceiling keeps the lockscreen readable.
const MAX_ACTIVITY_LABEL_LEN = 80;

function normalizeEmoji(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new Error("Emoji required");
  }
  if (trimmed.length > MAX_EMOJI_LEN) {
    throw new Error("Emoji too long");
  }
  return trimmed;
}

function clampLabel(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length <= MAX_ACTIVITY_LABEL_LEN) return trimmed;
  return `${trimmed.slice(0, MAX_ACTIVITY_LABEL_LEN - 1)}…`;
}

export const toggleReaction = mutation({
  args: {
    activityId: v.id("activityFeed"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const emoji = normalizeEmoji(args.emoji);

    const activity = await ctx.db.get(args.activityId);
    if (!activity) throw new Error("Activity not found");

    const existing = await ctx.db
      .query("feedReactions")
      .withIndex("by_activity_user_emoji", (q) =>
        q
          .eq("activityId", args.activityId)
          .eq("userId", user._id)
          .eq("emoji", emoji)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { reacted: false };
    }

    // Dedupe push: if this user already has any reaction on this activity
    // (a different emoji), they've already notified the author. Swap-emoji
    // toggling shouldn't re-buzz the author's phone.
    const priorFromMe = await ctx.db
      .query("feedReactions")
      .withIndex("by_activity_user", (q) =>
        q.eq("activityId", args.activityId).eq("userId", user._id)
      )
      .take(1);
    const alreadyNotified = priorFromMe.length > 0;

    await ctx.db.insert("feedReactions", {
      activityId: args.activityId,
      userId: user._id,
      emoji,
      createdAt: new Date().toISOString(),
    });

    // Fire push to activity author. Skip self-reactions and repeat-react
    // sessions. Scheduled post-commit so a push failure can't roll back
    // the reaction row.
    const isSelfReact = String(activity.userId) === String(user._id);
    if (!isSelfReact && !alreadyNotified) {
      await ctx.scheduler.runAfter(0, internal.pushActions.sendReactionPush, {
        toUserId: activity.userId,
        fromUserId: user._id,
        emoji,
        activityLabel: clampLabel(activity.message),
      });
    }

    return { reacted: true };
  },
});

export type ReactionSummary = {
  emoji: string;
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
          emoji,
          count,
          reacted: mine.has(emoji),
        });
      }
      result[String(activityId)] = summary;
    }

    return result;
  },
});
