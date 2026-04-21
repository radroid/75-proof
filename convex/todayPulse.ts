import { query } from "./_generated/server";
import { getAuthenticatedUserOrNull } from "./lib/auth";
import { Id } from "./_generated/dataModel";

const CATEGORY_META: Record<string, { label: string; icon: string }> = {
  fitness: { label: "Fitness", icon: "dumbbell" },
  nutrition: { label: "Nutrition", icon: "apple" },
  mind: { label: "Mind", icon: "book-open" },
};

type PulseRow = {
  category: string;
  label: string;
  icon: string;
  completed: number;
};

type PulseResult = {
  totalFriendsWithChallenge: number;
  friendsCompleteToday: number;
  categories: PulseRow[];
};

async function getFriendIds(
  ctx: any,
  userId: Id<"users">
): Promise<Id<"users">[]> {
  const sent = await ctx.db
    .query("friendships")
    .withIndex("by_user_status", (q: any) =>
      q.eq("userId", userId).eq("status", "accepted")
    )
    .collect();

  const received = await ctx.db
    .query("friendships")
    .withIndex("by_friend", (q: any) => q.eq("friendId", userId))
    .filter((q: any) => q.eq(q.field("status"), "accepted"))
    .collect();

  return [
    ...sent.map((f: any) => f.friendId),
    ...received.map((f: any) => f.userId),
  ];
}

export const getTodayPulse = query({
  args: {},
  handler: async (ctx): Promise<PulseResult> => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) {
      return {
        totalFriendsWithChallenge: 0,
        friendsCompleteToday: 0,
        categories: [],
      };
    }

    const friendIds = await getFriendIds(ctx, user._id);
    if (friendIds.length === 0) {
      return {
        totalFriendsWithChallenge: 0,
        friendsCompleteToday: 0,
        categories: [],
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const categoryCounts: Record<string, number> = {};
    let totalFriendsWithChallenge = 0;
    let friendsCompleteToday = 0;

    for (const friendId of friendIds) {
      const friend = await ctx.db.get(friendId);
      if (!friend) continue;

      const activeChallenge = await ctx.db
        .query("challenges")
        .withIndex("by_user", (q) => q.eq("userId", friendId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .unique();

      if (!activeChallenge || activeChallenge.visibility === "private") {
        continue;
      }

      const showCompletion =
        friend.preferences?.sharing?.showCompletionStatus ?? true;
      if (!showCompletion) continue;

      totalFriendsWithChallenge += 1;

      const habitDefs = await ctx.db
        .query("habitDefinitions")
        .withIndex("by_challenge", (q) =>
          q.eq("challengeId", activeChallenge._id)
        )
        .collect();

      const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);

      if (hardHabits.length > 0) {
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

        const completedCategoriesForFriend = new Set<string>();
        let allDone = true;
        for (const habit of hardHabits) {
          const entry = entryMap.get(String(habit._id));
          const done = entry?.completed === true;
          if (done && habit.category) {
            completedCategoriesForFriend.add(habit.category);
          }
          if (!done) allDone = false;
        }
        for (const cat of completedCategoriesForFriend) {
          categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
        }
        if (allDone) friendsCompleteToday += 1;
      } else {
        const log = await ctx.db
          .query("dailyLogs")
          .withIndex("by_date", (q) =>
            q.eq("userId", friendId).eq("date", today)
          )
          .unique();
        if (log) {
          const completedCats = new Set<string>();
          if (log.workout1 || log.outdoorWorkoutCompleted) {
            completedCats.add("fitness");
          }
          if (log.dietFollowed && log.noAlcohol && log.waterIntakeOz >= 128) {
            completedCats.add("nutrition");
          }
          if (log.readingMinutes >= 20) {
            completedCats.add("mind");
          }
          for (const cat of completedCats) {
            categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
          }
          if (log.allRequirementsMet) friendsCompleteToday += 1;
        }
      }
    }

    const categories: PulseRow[] = Object.entries(categoryCounts)
      .map(([category, completed]) => ({
        category,
        label: CATEGORY_META[category]?.label ?? category,
        icon: CATEGORY_META[category]?.icon ?? "circle",
        completed,
      }))
      .sort((a, b) => b.completed - a.completed);

    return {
      totalFriendsWithChallenge,
      friendsCompleteToday,
      categories,
    };
  },
});
