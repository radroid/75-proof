import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getFriends = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all accepted friendships where user is either the requester or recipient
    const sentFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "accepted")
      )
      .collect();

    const receivedFriendships = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "accepted"))
      .collect();

    // Get friend user IDs
    const friendIds = [
      ...sentFriendships.map((f) => f.friendId),
      ...receivedFriendships.map((f) => f.userId),
    ];

    // Get friend profiles
    const friends = await Promise.all(
      friendIds.map((id) => ctx.db.get(id))
    );

    return friends.filter(Boolean);
  },
});

export const getPendingRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get requests sent to this user
    const pendingRequests = await ctx.db
      .query("friendships")
      .withIndex("by_friend", (q) => q.eq("friendId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    // Get requester profiles
    const requesters = await Promise.all(
      pendingRequests.map(async (req) => ({
        request: req,
        user: await ctx.db.get(req.userId),
      }))
    );

    return requesters;
  },
});

export const getSentRequests = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sentRequests = await ctx.db
      .query("friendships")
      .withIndex("by_user_status", (q) =>
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .collect();

    const recipients = await Promise.all(
      sentRequests.map(async (req) => ({
        request: req,
        user: await ctx.db.get(req.friendId),
      }))
    );

    return recipients;
  },
});

export const sendFriendRequest = mutation({
  args: {
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.fromUserId === args.toUserId) {
      throw new Error("Cannot send friend request to yourself");
    }

    // Check if friendship already exists in either direction
    const existingSent = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.fromUserId))
      .filter((q) => q.eq(q.field("friendId"), args.toUserId))
      .unique();

    const existingReceived = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.toUserId))
      .filter((q) => q.eq(q.field("friendId"), args.fromUserId))
      .unique();

    if (existingSent || existingReceived) {
      throw new Error("Friend request already exists");
    }

    return await ctx.db.insert("friendships", {
      userId: args.fromUserId,
      friendId: args.toUserId,
      status: "pending",
      createdAt: new Date().toISOString(),
    });
  },
});

export const acceptFriendRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    if (friendship.status !== "pending") {
      throw new Error("Friend request is not pending");
    }

    await ctx.db.patch(args.friendshipId, {
      status: "accepted",
    });
  },
});

export const declineFriendRequest = mutation({
  args: { friendshipId: v.id("friendships") },
  handler: async (ctx, args) => {
    const friendship = await ctx.db.get(args.friendshipId);
    if (!friendship) {
      throw new Error("Friend request not found");
    }

    await ctx.db.patch(args.friendshipId, {
      status: "declined",
    });
  },
});

export const removeFriend = mutation({
  args: {
    userId: v.id("users"),
    friendId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Find and remove friendship in either direction
    const friendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("friendId"), args.friendId))
      .unique();

    const friendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_user", (q) => q.eq("userId", args.friendId))
      .filter((q) => q.eq(q.field("friendId"), args.userId))
      .unique();

    if (friendship1) {
      await ctx.db.delete(friendship1._id);
    }
    if (friendship2) {
      await ctx.db.delete(friendship2._id);
    }
  },
});

export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 2) {
      return [];
    }

    // Get all users and filter by display name
    // In production, you'd want a proper search index
    const allUsers = await ctx.db.query("users").collect();

    return allUsers.filter((user) =>
      user.displayName.toLowerCase().includes(args.searchTerm.toLowerCase())
    ).slice(0, 10);
  },
});
