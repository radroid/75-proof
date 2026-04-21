import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser, getAuthenticatedUserOrNull } from "./lib/auth";
import { Id } from "./_generated/dataModel";

const RATE_LIMIT_HOURS = 20;

async function areFriends(
  ctx: any,
  userA: Id<"users">,
  userB: Id<"users">
): Promise<boolean> {
  const ab = await ctx.db
    .query("friendships")
    .withIndex("by_user_friend", (q: any) =>
      q.eq("userId", userA).eq("friendId", userB)
    )
    .unique();
  if (ab?.status === "accepted") return true;

  const ba = await ctx.db
    .query("friendships")
    .withIndex("by_user_friend", (q: any) =>
      q.eq("userId", userB).eq("friendId", userA)
    )
    .unique();
  return ba?.status === "accepted";
}

export const sendNudge = mutation({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (user._id === args.toUserId) {
      throw new Error("Cannot nudge yourself");
    }

    const friends = await areFriends(ctx, user._id, args.toUserId);
    if (!friends) {
      throw new Error("You can only nudge friends");
    }

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - RATE_LIMIT_HOURS);
    const cutoffIso = cutoff.toISOString();

    const recent = await ctx.db
      .query("nudges")
      .withIndex("by_from_to_created", (q) =>
        q
          .eq("fromUserId", user._id)
          .eq("toUserId", args.toUserId)
          .gte("createdAt", cutoffIso)
      )
      .first();

    if (recent) {
      throw new Error("Already nudged recently");
    }

    await ctx.db.insert("nudges", {
      fromUserId: user._id,
      toUserId: args.toUserId,
      createdAt: new Date().toISOString(),
    });
    return { ok: true };
  },
});

export const getRecentNudgedFriendIds = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return [];

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - RATE_LIMIT_HOURS);
    const cutoffIso = cutoff.toISOString();

    const rows = await ctx.db
      .query("nudges")
      .withIndex("by_from_to_created", (q) =>
        q.eq("fromUserId", user._id)
      )
      .filter((q) => q.gte(q.field("createdAt"), cutoffIso))
      .collect();

    return rows.map((r) => String(r.toUserId));
  },
});

export const getIncomingNudges = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return [];

    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);
    const cutoffIso = cutoff.toISOString();

    const rows = await ctx.db
      .query("nudges")
      .withIndex("by_to_created", (q) =>
        q.eq("toUserId", user._id).gte("createdAt", cutoffIso)
      )
      .order("desc")
      .take(20);

    const enriched = await Promise.all(
      rows.map(async (row) => {
        const from = await ctx.db.get(row.fromUserId);
        if (!from) return null;
        return {
          _id: row._id,
          createdAt: row.createdAt,
          from: {
            _id: from._id,
            displayName: from.displayName,
            avatarUrl: from.avatarUrl,
          },
        };
      })
    );

    return enriched.filter((r): r is NonNullable<typeof r> => r !== null);
  },
});
