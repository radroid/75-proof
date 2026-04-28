"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { FriendProgressCard } from "./friend-progress-card";
import { WeeklyLeaderboard } from "./weekly-leaderboard";
import { TodayPulse } from "./today-pulse";
import { FriendSearch } from "./friend-search";
import { Users } from "lucide-react";

// Single source of truth — derived from the Convex query so backend
// shape changes propagate through to consumers at compile time.
export type FriendProgressList =
  FunctionReturnType<typeof api.feed.getFriendProgress>;

export interface FriendsListProps {
  friendProgress: FriendProgressList | undefined;
  /**
   * When true, the inline search input at the top is omitted — used on the
   * new Progress page where a more prominent "Add a friend" block lives in
   * the Requests section instead. Defaults to `false` so existing call
   * sites keep their search affordance.
   */
  hideSearch?: boolean;
}

export function FriendsList({ friendProgress, hideSearch = false }: FriendsListProps) {
  return (
    <div className="space-y-6">
      {!hideSearch && <FriendSearch variant="compact" />}

      {/* Today's pulse + weekly leaderboard (hidden when no friends) */}
      <TodayPulse />
      <WeeklyLeaderboard />

      {/* Friend progress grid */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Friends&apos; Progress
        </h3>
        {friendProgress === undefined ? (
          // Loading: keep the slot's height stable so the layout doesn't
          // jolt when the query resolves into an empty state or grid.
          <div
            className="grid gap-4 sm:grid-cols-2"
            role="status"
            aria-label="Loading friends' progress"
          >
            <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
            <div className="h-32 rounded-lg bg-muted/40 animate-pulse" />
          </div>
        ) : friendProgress.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12 px-6">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Add friends to see their progress here.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {/* When `hideSearch` is true, the inline search above this
                    block is hidden (Progress page mounts a dedicated "Add a
                    friend" search at the bottom instead), so the "Use the
                    search above" copy would point at nothing. */}
                {hideSearch
                  ? "Use the Add a friend search below to send a request."
                  : "Use the search above to find people by name."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {friendProgress
              .filter((fp): fp is NonNullable<typeof fp> => fp !== null)
              .map((fp) => (
                <FriendProgressCard key={fp.user._id} friend={fp} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
