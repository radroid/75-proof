"use client";

import { Id } from "@/convex/_generated/dataModel";
import { FriendsList } from "@/components/friends/friends-list";

interface Props {
  friendProgress: Array<{
    user: { _id: Id<"users">; displayName: string; avatarUrl?: string };
    challenge: { currentDay: number | null; startDate: string };
    todayComplete: boolean | null;
    coStreak?: number;
    habits?: Array<{
      _id: string;
      name: string;
      icon?: string;
      category?: string;
      isHard: boolean;
      completedToday: boolean | null;
    }> | null;
  }> | undefined;
}

/**
 * FRIENDS PROGRESS section. Wraps `<FriendsList>` (search + today pulse +
 * weekly leaderboard + friend-progress grid) under the standard Progress-
 * page section heading. Nudge buttons live on each `FriendProgressCard`
 * (existing, with 20h cooldown).
 */
export function FriendsSection({ friendProgress }: Props) {
  return (
    <section aria-labelledby="friends-heading">
      <div className="h-px bg-border mb-8 md:mb-12" />
      <h2
        id="friends-heading"
        className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-6"
      >
        Friends Progress
      </h2>
      <FriendsList friendProgress={friendProgress} />
    </section>
  );
}
