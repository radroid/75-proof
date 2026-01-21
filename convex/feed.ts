import { v } from "convex/values";
import { query } from "./_generated/server";

export const getPersonalFeed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(50);

    return activities;
  },
});

export const getFriendsFeed = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all accepted friendships
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

    if (friendIds.length === 0) {
      return [];
    }

    // Get activities from friends
    // For better performance in production, you'd want a more sophisticated approach
    const allActivities = await ctx.db
      .query("activityFeed")
      .order("desc")
      .take(200);

    // Filter to only friend activities and get their challenges visibility
    const friendActivities = [];
    for (const activity of allActivities) {
      if (friendIds.some((id) => id === activity.userId)) {
        // Check challenge visibility
        const challenge = await ctx.db.get(activity.challengeId);
        if (
          challenge &&
          (challenge.visibility === "public" ||
            challenge.visibility === "friends")
        ) {
          const user = await ctx.db.get(activity.userId);
          friendActivities.push({
            ...activity,
            user: user
              ? {
                  displayName: user.displayName,
                  avatarUrl: user.avatarUrl,
                }
              : null,
          });
        }
      }
    }

    return friendActivities.slice(0, 50);
  },
});

export const getPublicFeed = query({
  args: {},
  handler: async (ctx) => {
    // Get recent public activities
    const allActivities = await ctx.db
      .query("activityFeed")
      .order("desc")
      .take(100);

    const publicActivities = [];
    for (const activity of allActivities) {
      const challenge = await ctx.db.get(activity.challengeId);
      if (challenge && challenge.visibility === "public") {
        const user = await ctx.db.get(activity.userId);
        publicActivities.push({
          ...activity,
          user: user
            ? {
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
              }
            : null,
        });
      }
    }

    return publicActivities.slice(0, 30);
  },
});

export const getFriendProgress = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get all accepted friendships
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

    // Get friend profiles with their active challenges
    const friendProgress = await Promise.all(
      friendIds.map(async (friendId) => {
        const friend = await ctx.db.get(friendId);
        if (!friend) return null;

        const activeChallenge = await ctx.db
          .query("challenges")
          .withIndex("by_user", (q) => q.eq("userId", friendId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();

        if (
          !activeChallenge ||
          activeChallenge.visibility === "private"
        ) {
          return null;
        }

        // Get today's log
        const today = new Date().toISOString().split("T")[0];
        const todayLog = await ctx.db
          .query("dailyLogs")
          .withIndex("by_date", (q) =>
            q.eq("userId", friendId).eq("date", today)
          )
          .unique();

        return {
          user: {
            _id: friend._id,
            displayName: friend.displayName,
            avatarUrl: friend.avatarUrl,
          },
          challenge: {
            currentDay: activeChallenge.currentDay,
            startDate: activeChallenge.startDate,
          },
          todayComplete: todayLog?.allRequirementsMet ?? false,
        };
      })
    );

    return friendProgress.filter(Boolean);
  },
});
