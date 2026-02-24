import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthenticatedUserOrNull } from "./lib/auth";
import { Id } from "./_generated/dataModel";

// Helper: get accepted friend IDs for a user, excluding blocked
async function getFriendIds(ctx: any, userId: Id<"users">): Promise<Id<"users">[]> {
  const sentFriendships = await ctx.db
    .query("friendships")
    .withIndex("by_user_status", (q: any) =>
      q.eq("userId", userId).eq("status", "accepted")
    )
    .collect();

  const receivedFriendships = await ctx.db
    .query("friendships")
    .withIndex("by_friend", (q: any) => q.eq("friendId", userId))
    .filter((q: any) => q.eq(q.field("status"), "accepted"))
    .collect();

  return [
    ...sentFriendships.map((f: any) => f.friendId),
    ...receivedFriendships.map((f: any) => f.userId),
  ];
}

// Helper: get all user IDs blocked by or blocking this user
async function getBlockedUserIds(ctx: any, userId: Id<"users">): Promise<Set<string>> {
  const blockedByMe = await ctx.db
    .query("friendships")
    .withIndex("by_user_status", (q: any) =>
      q.eq("userId", userId).eq("status", "blocked")
    )
    .collect();

  const blockedMe = await ctx.db
    .query("friendships")
    .withIndex("by_friend", (q: any) => q.eq("friendId", userId))
    .filter((q: any) => q.eq(q.field("status"), "blocked"))
    .collect();

  const ids = new Set<string>();
  for (const b of blockedByMe) ids.add(b.friendId);
  for (const b of blockedMe) ids.add(b.userId);
  return ids;
}

export const getPersonalFeed = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return [];

    const activities = await ctx.db
      .query("activityFeed")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(50);

    return activities;
  },
});

export const getFriendsFeed = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return [];
    const friendIds = await getFriendIds(ctx, user._id);
    const blockedIds = await getBlockedUserIds(ctx, user._id);

    if (friendIds.length === 0) {
      return [];
    }

    // Filter out blocked friends
    const activeFriendIds = friendIds.filter((id) => !blockedIds.has(id));
    if (activeFriendIds.length === 0) {
      return [];
    }

    const friendIdSet = new Set(activeFriendIds.map(String));

    const allActivities = await ctx.db
      .query("activityFeed")
      .order("desc")
      .take(200);

    const friendActivities = [];
    for (const activity of allActivities) {
      if (friendIdSet.has(String(activity.userId))) {
        const challenge = await ctx.db.get(activity.challengeId);
        if (
          challenge &&
          (challenge.visibility === "public" ||
            challenge.visibility === "friends")
        ) {
          const activityUser = await ctx.db.get(activity.userId);
          friendActivities.push({
            ...activity,
            user: activityUser
              ? {
                  displayName: activityUser.displayName,
                  avatarUrl: activityUser.avatarUrl,
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
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return [];
    const friendIds = await getFriendIds(ctx, user._id);
    const blockedIds = await getBlockedUserIds(ctx, user._id);

    const friendProgress = await Promise.all(
      friendIds
        .filter((id) => !blockedIds.has(id))
        .map(async (friendId) => {
          const friend = await ctx.db.get(friendId);
          if (!friend) return null;

          const activeChallenge = await ctx.db
            .query("challenges")
            .withIndex("by_user", (q) => q.eq("userId", friendId))
            .filter((q) => q.eq(q.field("status"), "active"))
            .unique();

          if (!activeChallenge || activeChallenge.visibility === "private") {
            return null;
          }

          const sharing = friend.preferences?.sharing;
          const showDayNumber = sharing?.showDayNumber ?? true;
          const showCompletionStatus = sharing?.showCompletionStatus ?? true;

          let todayComplete = false;
          if (showCompletionStatus) {
            const today = new Date().toISOString().split("T")[0];

            // Dual-path: check new habit system first, fall back to legacy dailyLogs
            const habitDefs = await ctx.db
              .query("habitDefinitions")
              .withIndex("by_challenge", (q) =>
                q.eq("challengeId", activeChallenge._id)
              )
              .collect();

            const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);

            if (hardHabits.length > 0) {
              // New habit system
              const entries = await ctx.db
                .query("habitEntries")
                .withIndex("by_challenge_day", (q) =>
                  q
                    .eq("challengeId", activeChallenge._id)
                    .eq("dayNumber", activeChallenge.currentDay)
                )
                .collect();

              const entryMap = new Map(
                entries.map((e) => [String(e.habitDefinitionId), e])
              );

              todayComplete = hardHabits.every((h) => {
                const entry = entryMap.get(String(h._id));
                return entry?.completed === true;
              });
            } else {
              // Legacy dailyLogs system
              const todayLog = await ctx.db
                .query("dailyLogs")
                .withIndex("by_date", (q) =>
                  q.eq("userId", friendId).eq("date", today)
                )
                .unique();
              todayComplete = todayLog?.allRequirementsMet ?? false;
            }
          }

          return {
            user: {
              _id: friend._id,
              displayName: friend.displayName,
              avatarUrl: friend.avatarUrl,
            },
            challenge: {
              currentDay: showDayNumber ? activeChallenge.currentDay : null,
              startDate: activeChallenge.startDate,
            },
            todayComplete: showCompletionStatus ? todayComplete : null,
          };
        })
    );

    return friendProgress.filter(Boolean);
  },
});
