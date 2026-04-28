"use client";

import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { FriendProgressCard } from "./friend-progress-card";
import { WeeklyLeaderboard } from "./weekly-leaderboard";
import { TodayPulse } from "./today-pulse";
import { FriendSearch } from "./friend-search";
import { Users } from "lucide-react";

interface FriendsListProps {
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
        {!friendProgress || friendProgress.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12 px-6">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Add friends to see their progress here.
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use the search above to find people by name.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {friendProgress.map((fp) => (
              <FriendProgressCard key={fp.user._id} friend={fp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
