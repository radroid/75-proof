"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";

function rankIcon(rank: number) {
  if (rank === 1)
    return <Trophy className="h-3.5 w-3.5 text-yellow-500" aria-hidden="true" />;
  if (rank === 2)
    return <Medal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  if (rank === 3)
    return <Award className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />;
  return null;
}

export function WeeklyLeaderboard() {
  const board = useQuery(api.leaderboard.getFriendsLeaderboard);

  if (board === undefined || board.length <= 1) {
    return null;
  }

  const topThree = board.slice(0, 3);
  const selfRow = board.find((r) => r.isSelf);
  const selfRank = selfRow ? board.indexOf(selfRow) + 1 : null;
  const showSelfBelow =
    selfRow && selfRank !== null && selfRank > 3;

  return (
    <Card aria-label="Weekly leaderboard">
      <CardContent className="py-4 px-4 sm:px-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            This Week
          </h3>
          <span className="text-[11px] text-muted-foreground/70">
            Days completed · last 7 days
          </span>
        </div>
        <ol className="space-y-1.5">
          {topThree.map((row, idx) => {
            const rank = idx + 1;
            return (
              <LeaderboardRow key={row.user._id} row={row} rank={rank} />
            );
          })}
          {showSelfBelow && selfRow && selfRank !== null && (
            <>
              <li
                aria-hidden="true"
                className="text-center text-muted-foreground/50 text-xs leading-none py-0.5"
              >
                ···
              </li>
              <LeaderboardRow row={selfRow} rank={selfRank} />
            </>
          )}
        </ol>
      </CardContent>
    </Card>
  );
}

function LeaderboardRow({
  row,
  rank,
}: {
  row: {
    user: { _id: string; displayName: string; avatarUrl?: string };
    daysThisWeek: number;
    currentDay: number | null;
    isSelf: boolean;
  };
  rank: number;
}) {
  const icon = rankIcon(rank);
  return (
    <li
      className={[
        "flex items-center gap-3 rounded-md px-2 py-1.5 min-h-[40px]",
        row.isSelf ? "bg-primary/5 ring-1 ring-primary/20" : "",
      ].join(" ")}
    >
      <span className="w-5 text-center text-xs font-semibold tabular-nums text-muted-foreground shrink-0">
        {icon ?? rank}
      </span>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarImage src={row.user.avatarUrl} alt={row.user.displayName} />
        <AvatarFallback className="text-[10px]">
          {row.user.displayName.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {row.user.displayName}
        </p>
      </div>
      <div className="flex items-baseline gap-1 shrink-0">
        <span className="text-sm font-semibold tabular-nums">
          {row.daysThisWeek}
        </span>
        <span className="text-[11px] text-muted-foreground">
          / 7
        </span>
      </div>
    </li>
  );
}
