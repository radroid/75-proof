"use client";

import type { ComponentProps } from "react";
import { FriendsList } from "@/components/friends/friends-list";

interface Props {
  friendProgress: ComponentProps<typeof FriendsList>["friendProgress"];
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
