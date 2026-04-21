"use client";

import { useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import { toast } from "sonner";

type ReactionEmoji = "fire" | "muscle" | "clap" | "heart";

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

const REACTION_OPTIONS: { emoji: ReactionEmoji; glyph: string; label: string }[] = [
  { emoji: "fire", glyph: "🔥", label: "Fire" },
  { emoji: "muscle", glyph: "💪", label: "Strong" },
  { emoji: "clap", glyph: "👏", label: "Clap" },
  { emoji: "heart", glyph: "❤️", label: "Love" },
];

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
  const activityIds = useMemo(
    () => (feed ?? []).map((f) => f._id as Id<"activityFeed">),
    [feed]
  );
  const reactions = useQuery(
    api.reactions.getReactionsForActivities,
    activityIds.length > 0 ? { activityIds } : "skip"
  );
  const toggleReaction = useMutation(api.reactions.toggleReaction);

  const handleToggle = async (
    activityId: Id<"activityFeed">,
    emoji: ReactionEmoji
  ) => {
    try {
      await toggleReaction({ activityId, emoji });
    } catch {
      toast.error("Couldn't react. Try again.");
    }
  };

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
      {feed.map((item) => {
        const itemReactions = reactions?.[item._id] ?? [];
        const reactionMap = new Map(itemReactions.map((r) => [r.emoji, r]));
        return (
          <Card key={item._id}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 mt-0.5 shrink-0">
                  <AvatarImage
                    src={item.user?.avatarUrl}
                    alt={item.user?.displayName}
                  />
                  <AvatarFallback className="text-xs">
                    {item.user?.displayName?.charAt(0).toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate min-w-0">
                      {item.user?.displayName ?? "Unknown"}
                    </span>
                    <span className="shrink-0" aria-hidden="true">
                      {typeIcons[item.type]}
                    </span>
                    <span className="text-xs text-muted-foreground/60 shrink-0 ml-auto">
                      {relativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 break-words">
                    {item.message}
                  </p>
                  <div
                    className="mt-2 flex flex-wrap items-center gap-1.5"
                    aria-label="Reactions"
                  >
                    {REACTION_OPTIONS.map(({ emoji, glyph, label }) => {
                      const r = reactionMap.get(emoji);
                      const count = r?.count ?? 0;
                      const reacted = r?.reacted ?? false;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() =>
                            handleToggle(item._id as Id<"activityFeed">, emoji)
                          }
                          aria-pressed={reacted}
                          aria-label={`${label} reaction${
                            count > 0 ? `, ${count}` : ""
                          }`}
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs leading-none transition-colors min-h-[28px]",
                            reacted
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                          ].join(" ")}
                        >
                          <span aria-hidden="true" className="text-sm">
                            {glyph}
                          </span>
                          {count > 0 && (
                            <span className="tabular-nums">{count}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
