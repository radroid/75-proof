import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthenticatedUser } from "./lib/auth";
import { Id } from "./_generated/dataModel";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function findFriendship(
  ctx: { db: any },
  userA: Id<"users">,
  userB: Id<"users">
) {
  const ab = await ctx.db
    .query("friendships")
    .withIndex("by_user_friend", (q: any) =>
      q.eq("userId", userA).eq("friendId", userB)
    )
    .unique();
  if (ab) return ab;

  return await ctx.db
    .query("friendships")
    .withIndex("by_user_friend", (q: any) =>
      q.eq("userId", userB).eq("friendId", userA)
    )
    .unique();
}

async function isBlocked(
  ctx: { db: any },
  userA: Id<"users">,
  userB: Id<"users">
) {
  const ab = await ctx.db
    .query("friendships")
    .withIndex("by_user_friend", (q: any) =>
      q.eq("userId", userA).eq("friendId", userB)
    )
    .filter((q: any) => q.eq(q.field("status"), "blocked"))
    .unique();
  if (ab) return true;

  const ba = await ctx.db
    .query("friendships")
    .withIndex("by_user_friend", (q: any) =>
      q.eq("userId", userB).eq("friendId", userA)
    )
    .filter((q: any) => q.eq(q.field("status"), "blocked"))
    .unique();
  return !!ba;
}

// ── Queries ──────────────────────────────────────────────────────────────────

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const sentFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "accepted")
      )
      .collect();

    const receivedFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", user._id))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    const friends = await Promise.all(
      friendIds.map(async (id) => {
        const friend = await ctx.db.get(id);
        if (!friend) return null;
        return {
          _id: friend._id,
          displayName: friend.displayName,
          avatarUrl: friend.avatarUrl,
        };
      })
    );

    return friends.filter(Boolean);
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const pendingRequests = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const requesters = await Promise.all(
      pendingRequests.map(async (req) => {
        const requester = await ctx.db.get(req.userId);
        return {
          request: req,
          user: requester
            ? {
                _id: requester._id,
                displayName: requester.displayName,
                avatarUrl: requester.avatarUrl,
              }
            : null,
        };
      })
    );

    return requesters;
  },
});

export const getSentRequests = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const sentRequests = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending")
      )
      .collect();

    const recipients = await Promise.all(
      sentRequests.map(async (req) => {
        const recipient = await ctx.db.get(req.friendId);
        return {
          request: req,
          user: recipient
            ? {
                _id: recipient._id,
                displayName: recipient.displayName,
                avatarUrl: recipient.avatarUrl,
              }
            : null,
        };
      })
    );

    return recipients;
  },
});

export const getPendingRequestCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    const pendingRequests = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", user._id))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    return pendingRequests.length;
  },
});

export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 2) {
      return [];
    }

    const user = await getAuthenticatedUser(ctx);

    const results = await ctx.db
      .query("users")
      .withSearchIndex("search_displayName", (q) =>
        q.search("displayName", args.searchTerm)
      )
      .take(15);

    return results
      .filter((u) => u._id !== user._id)
      .slice(0, 10)
      .map((u) => ({
        _id: u._id,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      }));
  },
});

export const getRelationshipStatuses = query({
  args: { targetUserIds: v.array(v.id("users")) },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const statuses: Record<
      string,
      "friends" | "request_sent" | "request_received" | "blocked" | "none"
    > = {};

    for (const targetId of args.targetUserIds) {
      // Check both directions
      const ab = await ctx.db
        .query("friendships")
        .withIndex("by_user_friend", (q) =>
          q.eq("userId", user._id).eq("friendId", targetId)
        )
        .unique();

      const ba = await ctx.db
        .query("friendships")
        .withIndex("by_user_friend", (q) =>
          q.eq("userId", targetId).eq("friendId", user._id)
        )
        .unique();

      const row = ab ?? ba;

      if (!row) {
        statuses[targetId] = "none";
      } else if (row.status === "blocked") {
        statuses[targetId] = "blocked";
      } else if (row.status === "accepted") {
        statuses[targetId] = "friends";
      } else if (row.status === "pending") {
        if (row.userId === user._id) {
          statuses[targetId] = "request_sent";
        } else {
          statuses[targetId] = "request_received";
        }
      } else {
        // declined — treat as none (allows re-send)
        statuses[targetId] = "none";
      }
    }

    return statuses;
  },
});

// ── Mutations ────────────────────────────────────────────────────────────────

export const sendFriendRequest = mutation({
  args: { toUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (user._id === args.toUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if blocked in either direction — reject silently
    const blocked = await isBlocked(ctx, user._id, args.toUserId);
    if (blocked) {
      return null;
    }

    // Check existing friendship in either direction
    const ab = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", user._id).eq("friendId", args.toUserId)
      )
      .unique();

    const ba = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", args.toUserId).eq("friendId", user._id)
      )
      .unique();

    const existing = ab ?? ba;

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("Already friends");
      }
      if (existing.status === "pending") {
        // If they sent us a request, auto-accept
        if (existing.userId === args.toUserId) {
          await ctx.db.patch(existing._id, { status: "accepted" });
          return existing._id;
        }
        // We already sent them a request
        throw new Error("Friend request already sent");
      }
      if (existing.status === "declined") {
        // Delete old row so we can re-send
        await ctx.db.delete(existing._id);
      }
    }

    return await ctx.db.insert("friendships", {
      userId: user._id,
      friendId: args.toUserId,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

export const acceptFriendRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }
    if (friendship.friendId !== user._id) {
      throw new Error("Not authorized to accept this request");
    }
    if (friendship.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    await ctx.db.patch(args.friendshipId, { status: "accepted" });
  },
});

export const declineFriendRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    const friendship = await ctx.db.get(args.friendshipId);

    if (!friendship) {
      throw new Error("Friend request not found");
    }
    // Allow either party to cancel/decline
    if (friendship.friendId !== user._id && friendship.userId !== user._id) {
      throw new Error("Not authorized");
    }

    // Delete the row so re-requests work
    await ctx.db.delete(args.friendshipId);
  },
});

export const removeFriend = mutation({
  args: { friendId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const friendship = await findFriendship(ctx, user._id, args.friendId);
    if (friendship) {
      await ctx.db.delete(friendship._id);
    }
  },
});

export const blockUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    if (user._id === args.targetUserId) {
      throw new Error("Cannot block yourself");
    }

    // Remove any existing friendship in either direction
    const existing = await findFriendship(ctx, user._id, args.targetUserId);
    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Insert blocked row (blocker is always userId)
    await ctx.db.insert("friendships", {
      userId: user._id,
      friendId: args.targetUserId,
      status: "blocked",
      createdAt: new Date().toISOString(),
    });
  },
});

export const unblockUser = mutation({
  args: { targetUserId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);

    const blocked = await ctx.db
      .query("friendships")
      .withIndex("by_user_friend", (q) =>
        q.eq("userId", user._id).eq("friendId", args.targetUserId)
      )
      .filter((q) => q.eq(q.field("status"), "blocked"))
      .unique();

    if (blocked) {
      await ctx.db.delete(blocked._id);
    }
  },
});
