import { query } from "./_generated/server";
import { getAuthenticatedUserOrNull } from "./lib/auth";
import { Id } from "./_generated/dataModel";

type LeaderboardRow = {
  user: {
    _id: Id<"users">;
    displayName: string;
    avatarUrl?: string;
  };
  daysThisWeek: number;
  daysLastWeek: number;
  currentDay: number | null;
  isSelf: boolean;
};

type LeaderboardResult = {
  rows: LeaderboardRow[];
  weekStart: string;
  weekEnd: string;
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

function dateKey(iso: string): string {
  return iso.split("T")[0];
}

export const getFriendsLeaderboard = query({
  args: {},
  handler: async (ctx): Promise<LeaderboardResult> => {
    const user = await getAuthenticatedUserOrNull(ctx);
    const emptyResult: LeaderboardResult = {
      rows: [],
      weekStart: "",
      weekEnd: "",
    };
    if (!user) return emptyResult;

    const friendIds = await getFriendIds(ctx, user._id);
    const participantIds: Id<"users">[] = [user._id, ...friendIds];

    const now = new Date();
    const thisWeekStart = new Date(now);
    thisWeekStart.setDate(thisWeekStart.getDate() - 6);
    thisWeekStart.setHours(0, 0, 0, 0);

    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);

    const fourteenDaysAgo = new Date(lastWeekStart);
    const cutoff = fourteenDaysAgo.toISOString();
    const thisWeekStartIso = thisWeekStart.toISOString();

    const rows = await Promise.all(
      participantIds.map(async (participantId) => {
        const participant = await ctx.db.get(participantId);
        if (!participant) return null;

        const isSelf = String(participantId) === String(user._id);

        const activities = await ctx.db
          .query("activityFeed")
          .withIndex("by_user_created", (q) =>
            q.eq("userId", participantId).gte("createdAt", cutoff)
          )
          .collect();

        const thisWeekDays = new Set<string>();
        const lastWeekDays = new Set<string>();
        for (const a of activities) {
          if (a.type !== "day_completed") continue;
          const key = dateKey(a.createdAt);
          if (a.createdAt >= thisWeekStartIso) {
            thisWeekDays.add(key);
          } else {
            lastWeekDays.add(key);
          }
        }

        const activeChallenge = await ctx.db
          .query("challenges")
          .withIndex("by_user", (q) => q.eq("userId", participantId))
          .filter((q) => q.eq(q.field("status"), "active"))
          .unique();

        let currentDay: number | null = null;
        if (activeChallenge) {
          if (isSelf) {
            currentDay = activeChallenge.currentDay;
          } else if (activeChallenge.visibility !== "private") {
            const showDayNumber =
              participant.preferences?.sharing?.showDayNumber ?? true;
            currentDay = showDayNumber ? activeChallenge.currentDay : null;
          }
        }

        const row: LeaderboardRow = {
          user: {
            _id: participant._id,
            displayName: isSelf ? "You" : participant.displayName,
            avatarUrl: participant.avatarUrl,
          },
          daysThisWeek: thisWeekDays.size,
          daysLastWeek: lastWeekDays.size,
          currentDay,
          isSelf,
        };
        return row;
      })
    );

    const filtered = rows.filter((r): r is LeaderboardRow => r !== null);
    filtered.sort((a, b) => {
      if (b.daysThisWeek !== a.daysThisWeek) {
        return b.daysThisWeek - a.daysThisWeek;
      }
      return (b.currentDay ?? 0) - (a.currentDay ?? 0);
    });

    const weekEnd = new Date(now);
    weekEnd.setHours(0, 0, 0, 0);

    return {
      rows: filtered,
      weekStart: dateKey(thisWeekStart.toISOString()),
      weekEnd: dateKey(weekEnd.toISOString()),
    };
  },
});
