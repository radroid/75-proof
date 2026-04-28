"use client";

import { useQuery } from "convex/react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { Sparkles, Users } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { CoStreakChip } from "@/components/friends/co-streak-chip";
import { aggregateFriendProgress } from "@/lib/progress-metrics";
import { cn } from "@/lib/utils";

interface Props {
  /** Fires once when the ribbon first becomes visible — for analytics. */
  onImpression?: () => void;
}

/**
 * Friends ribbon (research §3.3). Three rows of kindness-only signals:
 *   1. Anonymized aggregate ("3 of 6 friends finished today")
 *   2. Featured highest-current co-streak (named friend) — Duolingo Friend Streak
 *   3. Cheers-glance composed client-side from `getPersonalFeed` +
 *      `getReactionsForActivities`. Promote to a dedicated server query
 *      (PD-12) only if telemetry shows it's hot.
 *
 * Hidden entirely when the user has no friends yet — research §7 says we
 * shouldn't render an "Add friends" CTA on Progress, that belongs on Friends.
 */
export function FriendsRibbon({ onImpression }: Props) {
  const friendProgress = useQuery(api.feed.getFriendProgress);
  const personalFeed = useQuery(api.feed.getPersonalFeed);

  // Collect last-7-day activity ids from the personal feed so we can ask
  // for their reactions in a single query. Empty list → skip the query.
  const recentActivityIds = useMemo<Id<"activityFeed">[]>(() => {
    if (!personalFeed) return [];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return personalFeed
      .filter((a) => Date.parse(a.createdAt) >= sevenDaysAgo)
      .slice(0, 20)
      .map((a) => a._id);
  }, [personalFeed]);

  const reactions = useQuery(
    api.reactions.getReactionsForActivities,
    recentActivityIds.length > 0 ? { activityIds: recentActivityIds } : "skip",
  );

  const totalCheers = useMemo(() => {
    if (!reactions) return 0;
    let total = 0;
    for (const list of Object.values(reactions)) {
      for (const r of list) total += r.count;
    }
    return total;
  }, [reactions]);

  const aggregate = useMemo(
    () =>
      friendProgress
        ? aggregateFriendProgress(friendProgress as any)
        : null,
    [friendProgress],
  );

  // Highest current co-streak: pick the friend with the largest >0 coStreak.
  const featuredCoStreak = useMemo(() => {
    if (!friendProgress) return null;
    let best: { name: string; days: number } | null = null;
    for (const fp of friendProgress as Array<{
      user: { displayName: string };
      coStreak: number;
    } | null>) {
      if (!fp) continue;
      if (fp.coStreak <= 0) continue;
      if (!best || fp.coStreak > best.days) {
        best = { name: fp.user.displayName, days: fp.coStreak };
      }
    }
    return best;
  }, [friendProgress]);

  const hasAggregate = !!aggregate && aggregate.totalEligible > 0;
  const hasCheers = totalCheers > 0;
  const hasCoStreak = featuredCoStreak !== null;
  const willRender =
    friendProgress !== undefined &&
    friendProgress.length > 0 &&
    (hasAggregate || hasCoStreak || hasCheers);

  // Fire impression at most once per mount, only when we'll render anything.
  const firedRef = useRef(false);
  useEffect(() => {
    if (willRender && !firedRef.current && onImpression) {
      firedRef.current = true;
      onImpression();
    }
  }, [willRender, onImpression]);

  if (!willRender) return null;

  const finishedToday = aggregate?.finishedToday ?? 0;
  const totalEligible = aggregate?.totalEligible ?? 0;

  return (
    <div className="rounded-2xl border bg-card/40 p-4 md:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          With friends
        </p>
      </div>

      {hasAggregate && (
        <div>
          <p className="text-sm">
            <span className="font-medium tabular-nums">
              {finishedToday} of {totalEligible}
            </span>{" "}
            <span className="text-muted-foreground">
              friend{totalEligible === 1 ? "" : "s"} finished today
            </span>
          </p>
          <div className="mt-2 flex items-center gap-1" aria-hidden="true">
            {Array.from({ length: totalEligible }, (_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full",
                  i < finishedToday ? "bg-success" : "bg-muted",
                )}
              />
            ))}
          </div>
        </div>
      )}

      {hasCoStreak && (
        <div>
          <CoStreakChip
            days={featuredCoStreak!.days}
            friendName={featuredCoStreak!.name}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            You and {featuredCoStreak!.name}
          </p>
        </div>
      )}

      {hasCheers && (
        <Link
          href="/dashboard/friends"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {totalCheers} cheer{totalCheers === 1 ? "" : "s"} on your recent activity
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </div>
  );
}
