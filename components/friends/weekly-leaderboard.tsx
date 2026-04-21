"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Medal, Award, ArrowUp, ArrowDown, Minus } from "lucide-react";

function rankIcon(rank: number) {
  if (rank === 1)
    return <Trophy className="h-3.5 w-3.5 text-yellow-500" aria-hidden="true" />;
  if (rank === 2)
    return <Medal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />;
  if (rank === 3)
    return <Award className="h-3.5 w-3.5 text-orange-500" aria-hidden="true" />;
  return null;
}

function formatRange(startIso: string, endIso: string): string {
  if (!startIso || !endIso) return "";
  const start = new Date(startIso + "T00:00:00");
  const end = new Date(endIso + "T00:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function WeeklyLeaderboard() {
  const data = useQuery(api.leaderboard.getFriendsLeaderboard);

  if (data === undefined || data.rows.length <= 1) {
    return null;
  }

  const { rows, weekStart, weekEnd } = data;
  const topThree = rows.slice(0, 3);
  const selfRow = rows.find((r) => r.isSelf);
  const selfRank = selfRow ? rows.indexOf(selfRow) + 1 : null;
  const showSelfBelow = selfRow && selfRank !== null && selfRank > 3;

  return (
    <Card aria-label="Weekly leaderboard">
      <CardContent className="py-4 px-4 sm:px-5">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            This Week
          </h3>
          <span className="text-[11px] text-muted-foreground/70 tabular-nums">
            {formatRange(weekStart, weekEnd)}
          </span>
        </div>
        <ol className="space-y-1.5">
          {topThree.map((row, idx) => (
            <LeaderboardRow key={row.user._id} row={row} rank={idx + 1} />
          ))}
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

function Delta({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] text-success"
        title={`+${delta} vs last week`}
      >
        <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
        <span className="tabular-nums">{delta}</span>
      </span>
    );
  }
  if (delta < 0) {
    return (
      <span
        className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground"
        title={`${delta} vs last week`}
      >
        <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
        <span className="tabular-nums">{Math.abs(delta)}</span>
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60"
      title="Same as last week"
    >
      <Minus className="h-2.5 w-2.5" aria-hidden="true" />
    </span>
  );
}

function LeaderboardRow({
  row,
  rank,
}: {
  row: {
    user: { _id: string; displayName: string; avatarUrl?: string };
    daysThisWeek: number;
    daysLastWeek: number;
    currentDay: number | null;
    isSelf: boolean;
  };
  rank: number;
}) {
  const icon = rankIcon(rank);
  const delta = row.daysThisWeek - row.daysLastWeek;
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
      <Delta delta={delta} />
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
