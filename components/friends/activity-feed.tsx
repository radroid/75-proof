"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Rocket,
  Trophy,
  RotateCcw,
  Flame,
  Activity,
} from "lucide-react";

type FeedItem = {
  _id: string;
  type: "day_completed" | "challenge_started" | "challenge_completed" | "challenge_failed" | "milestone";
  message: string;
  createdAt: string;
  dayNumber?: number;
  user: {
    displayName: string;
    avatarUrl?: string;
  } | null;
};

const typeIcons: Record<FeedItem["type"], React.ReactNode> = {
  day_completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  challenge_started: <Rocket className="h-4 w-4 text-primary" />,
  challenge_completed: <Trophy className="h-4 w-4 text-yellow-500" />,
  challenge_failed: <RotateCcw className="h-4 w-4 text-destructive" />,
  milestone: <Flame className="h-4 w-4 text-orange-500" />,
};

function relativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

interface ActivityFeedProps {
  feed: FeedItem[] | undefined;
}

export function ActivityFeed({ feed }: ActivityFeedProps) {
  if (!feed || feed.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center py-12">
          <Activity className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            No activity from friends yet.
          </p>
          <p className="text-muted-foreground/60 text-xs mt-1">
            Add friends to see their progress here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {feed.map((item) => (
        <Card key={item._id}>
          <CardContent className="py-3 px-4">
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8 mt-0.5">
                <AvatarImage
                  src={item.user?.avatarUrl}
                  alt={item.user?.displayName}
                />
                <AvatarFallback className="text-xs">
                  {item.user?.displayName?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">
                    {item.user?.displayName ?? "Unknown"}
                  </span>
                  {typeIcons[item.type]}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.message}
                </p>
              </div>
              <span className="text-xs text-muted-foreground/60 flex-shrink-0 mt-0.5">
                {relativeTime(item.createdAt)}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
