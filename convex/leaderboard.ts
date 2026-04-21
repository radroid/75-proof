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
  currentDay: number | null;
  isSelf: boolean;
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

export const getFriendsLeaderboard = query({
  args: {},
  handler: async (ctx): Promise<LeaderboardRow[]> => {
    const user = await getAuthenticatedUserOrNull(ctx);
    if (!user) return [];

    const friendIds = await getFriendIds(ctx, user._id);
    const participantIds: Id<"users">[] = [user._id, ...friendIds];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString();

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

        const daysThisWeek = activities.filter(
          (a) => a.type === "day_completed"
        ).length;

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
          daysThisWeek,
          currentDay,
          isSelf,
        };
        return row;
      })
    );

    return rows
      .filter((r): r is LeaderboardRow => r !== null)
      .sort((a, b) => {
        if (b.daysThisWeek !== a.daysThisWeek) {
          return b.daysThisWeek - a.daysThisWeek;
        }
        return (b.currentDay ?? 0) - (a.currentDay ?? 0);
      });
  },
});
