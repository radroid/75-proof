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
      if (activity.backfilled) continue;
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
            // Surface the userId so consumers (e.g. the per-friend capsule
            // filter on Progress) can group/filter rows without relying on
            // the user's mutable display name.
            userId: activity.userId,
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
      if (activity.backfilled) continue;
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

    const myCompletionByDate = await getUserCompletionByDate(ctx, user._id);

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
          const showHabits = sharing?.showHabits ?? true;

          let todayComplete = false;
          let friendCompletionByDate: Map<string, boolean> = new Map();
          if (showCompletionStatus) {
            friendCompletionByDate = await getUserCompletionByDate(
              ctx,
              friendId
            );
            const today = new Date().toISOString().split("T")[0];
            todayComplete = friendCompletionByDate.get(today) === true;
          }

          const coStreak = showCompletionStatus
            ? computeCoStreak(myCompletionByDate, friendCompletionByDate)
            : 0;

          let habits: Array<{
            _id: Id<"habitDefinitions">;
            name: string;
            icon?: string;
            category?: string;
            isHard: boolean;
            completedToday: boolean | null;
          }> | null = null;

          if (showHabits) {
            const habitDefs = await ctx.db
              .query("habitDefinitions")
              .withIndex("by_challenge", (q) =>
                q.eq("challengeId", activeChallenge._id)
              )
              .collect();

            const activeHabits = habitDefs
              .filter((h) => h.isActive)
              .sort((a, b) => a.sortOrder - b.sortOrder);

            if (activeHabits.length > 0) {
              let todayCompletionByHabit = new Map<string, boolean>();
              if (showCompletionStatus) {
                const entries = await ctx.db
                  .query("habitEntries")
                  .withIndex("by_challenge_day", (q) =>
                    q
                      .eq("challengeId", activeChallenge._id)
                      .eq("dayNumber", activeChallenge.currentDay)
                  )
                  .collect();
                todayCompletionByHabit = new Map(
                  entries.map((e) => [
                    String(e.habitDefinitionId),
                    e.completed,
                  ])
                );
              }

              habits = activeHabits.map((h) => ({
                _id: h._id,
                name: h.name,
                icon: h.icon,
                category: h.category,
                isHard: h.isHard,
                completedToday: showCompletionStatus
                  ? todayCompletionByHabit.get(String(h._id)) === true
                  : null,
              }));
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
              daysTotal: activeChallenge.daysTotal ?? 75,
              isHabitTracker: activeChallenge.isHabitTracker === true,
            },
            todayComplete: showCompletionStatus ? todayComplete : null,
            coStreak,
            habits,
          };
        })
    );

    return friendProgress.filter(Boolean);
  },
});

async function getUserCompletionByDate(
  ctx: any,
  userId: Id<"users">
): Promise<Map<string, boolean>> {
  const activeChallenge = await ctx.db
    .query("challenges")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .filter((q: any) => q.eq(q.field("status"), "active"))
    .unique();

  const result = new Map<string, boolean>();
  if (!activeChallenge) return result;

  const habitDefs = await ctx.db
    .query("habitDefinitions")
    .withIndex("by_challenge", (q: any) =>
      q.eq("challengeId", activeChallenge._id)
    )
    .collect();

  const hardHabits = habitDefs.filter((h: any) => h.isActive && h.isHard);

  if (hardHabits.length > 0) {
    const entries = await ctx.db
      .query("habitEntries")
      .withIndex("by_challenge_day", (q: any) =>
        q.eq("challengeId", activeChallenge._id)
      )
      .collect();

    const byDate = new Map<string, Map<string, boolean>>();
    for (const entry of entries) {
      if (!byDate.has(entry.date)) byDate.set(entry.date, new Map());
      byDate.get(entry.date)!.set(String(entry.habitDefinitionId), entry.completed);
    }
    for (const [date, habitMap] of byDate) {
      const allDone = hardHabits.every((h: any) => habitMap.get(String(h._id)) === true);
      result.set(date, allDone);
    }
  } else {
    const logs = await ctx.db
      .query("dailyLogs")
      .withIndex("by_challenge", (q: any) =>
        q.eq("challengeId", activeChallenge._id)
      )
      .collect();
    for (const log of logs) {
      result.set(log.date, log.allRequirementsMet === true);
    }
  }

  return result;
}

function computeCoStreak(
  mine: Map<string, boolean>,
  theirs: Map<string, boolean>
): number {
  if (mine.size === 0 || theirs.size === 0) return 0;

  // Cap how far back we'll walk to compute a co-streak. 365 covers the longest
  // configurable challenge length (and is forgiving for habit-tracker mode).
  const MAX_LOOKBACK = 365;
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // Allow today to not yet be complete: if either isn't complete today,
  // start counting from yesterday instead.
  const date = new Date(cursor);
  const todayStr = date.toISOString().split("T")[0];
  const bothToday =
    mine.get(todayStr) === true && theirs.get(todayStr) === true;
  if (!bothToday) {
    date.setDate(date.getDate() - 1);
  }

  for (let i = 0; i < MAX_LOOKBACK; i++) {
    const dateStr = date.toISOString().split("T")[0];
    if (mine.get(dateStr) === true && theirs.get(dateStr) === true) {
      streak += 1;
      date.setDate(date.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}
