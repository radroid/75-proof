"use client";

import { useMemo, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Activity } from "lucide-react";
import { toast } from "sonner";
import { EmojiPicker } from "./emoji-picker";
import { haptic } from "@/lib/haptics";
import { useThemePersonality } from "@/components/theme-provider";
import { Star } from "@/components/earned";
import { ThemedIcon } from "@/components/earned/icons";

export type FeedItem = {
  _id: string;
  // Exposed so consumers (e.g. the per-friend capsule filter on Progress)
  // can group/filter feed items without relying on `user.displayName`.
  userId: Id<"users">;
  type: "day_completed" | "challenge_started" | "challenge_completed" | "challenge_failed" | "milestone";
  message: string;
  createdAt: string;
  dayNumber?: number;
  user: {
    displayName: string;
    avatarUrl?: string;
  } | null;
};

// Default (non-Earned) icons for the activity feed. Each event type
// gets a colour-coded Lucide glyph. The Earned variant lives in
// `earnedTypeIcons` below and uses hand-drawn equivalents from the
// `components/earned/icons/` module — day-completed/challenge-completed
// reuse the brand gold Star (no new icon needed) since "earning a star"
// is the product's central metaphor.
const typeIcons: Record<FeedItem["type"], React.ReactNode> = {
  day_completed: <CheckCircle2 className="h-4 w-4 text-success" />,
  challenge_started: (
    <ThemedIcon name="rocket" className="h-4 w-4 text-primary" />
  ),
  challenge_completed: (
    <ThemedIcon name="trophy" className="h-4 w-4 text-yellow-500" />
  ),
  challenge_failed: (
    <ThemedIcon name="rotate-cw" className="h-4 w-4 text-destructive" />
  ),
  milestone: <ThemedIcon name="flame" className="h-4 w-4 text-orange-500" />,
};

// Earned-theme overrides. day_completed reuses the brand gold Star
// so the feed reads as "I earned a star here" rather than "I checked
// a box". challenge_completed gets the distinct hand-drawn trophy —
// reusing Star at both day + challenge granularity would collapse
// the visual hierarchy of the feed at-a-glance. The remaining glyphs
// route through ThemedIcon to pick up their hand-drawn variants.
const earnedTypeIcons: Record<FeedItem["type"], React.ReactNode> = {
  day_completed: <Star size={16} />,
  challenge_started: (
    <ThemedIcon name="rocket" className="h-4 w-4 text-primary" />
  ),
  challenge_completed: (
    <ThemedIcon name="trophy" className="h-4 w-4 text-[var(--earned-star-gold)]" />
  ),
  challenge_failed: (
    <ThemedIcon name="rotate-cw" className="h-4 w-4 text-destructive" />
  ),
  milestone: <ThemedIcon name="flame" className="h-4 w-4 text-primary" />,
};

// Legacy preset keys → display glyph (kept for backwards compat with v1 data)
const LEGACY_GLYPHS: Record<string, string> = {
  fire: "🔥",
  muscle: "💪",
  clap: "👏",
  heart: "❤️",
};

const DEFAULT_REACTIONS: string[] = ["🔥", "💪", "👏", "❤️"];

function displayGlyph(emoji: string): string {
  return LEGACY_GLYPHS[emoji] ?? emoji;
}

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

type OverrideKey = `${string}:${string}`;
type Override = { reacted: boolean; delta: number };

export function ActivityFeed({ feed }: ActivityFeedProps) {
  const { personality } = useThemePersonality();
  const isEarned = personality === "earned";
  const iconMap = isEarned ? earnedTypeIcons : typeIcons;
  const activityIds = useMemo(
    () => (feed ?? []).map((f) => f._id as Id<"activityFeed">),
    [feed]
  );
  const reactions = useQuery(
    api.reactions.getReactionsForActivities,
    activityIds.length > 0 ? { activityIds } : "skip"
  );
  const toggleReaction = useMutation(api.reactions.toggleReaction);
  const [overrides, setOverrides] = useState<Map<OverrideKey, Override>>(
    new Map()
  );
  const [tapped, setTapped] = useState<OverrideKey | null>(null);
  // Per-item set of user-picked emojis that aren't yet on the server
  const [locallyPicked, setLocallyPicked] = useState<Map<string, Set<string>>>(
    new Map()
  );

  const handleToggle = useCallback(
    async (
      activityId: Id<"activityFeed">,
      emoji: string,
      serverReacted: boolean
    ) => {
      const key: OverrideKey = `${activityId}:${emoji}`;
      const nextReacted = !serverReacted;
      haptic("selection");
      setOverrides((prev) => {
        const next = new Map(prev);
        next.set(key, { reacted: nextReacted, delta: nextReacted ? 1 : -1 });
        return next;
      });
      setTapped(key);
      window.setTimeout(() => {
        setTapped((current) => (current === key ? null : current));
      }, 220);

      try {
        await toggleReaction({ activityId, emoji });
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      } catch {
        setOverrides((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        toast.error("Couldn't react. Try again.");
      }
    },
    [toggleReaction]
  );

  const handlePick = useCallback(
    (activityId: string, emoji: string) => {
      setLocallyPicked((prev) => {
        const next = new Map(prev);
        const set = new Set(next.get(activityId) ?? []);
        set.add(emoji);
        next.set(activityId, set);
        return next;
      });
      // Toggle it on (serverReacted=false because we're adding)
      handleToggle(activityId as Id<"activityFeed">, emoji, false);
    },
    [handleToggle]
  );

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
        const localPicks = locallyPicked.get(item._id) ?? new Set<string>();

        // Compose the visible set: server emojis + defaults + local picks
        const visible = new Set<string>([
          ...DEFAULT_REACTIONS,
          ...Array.from(reactionMap.keys()).map(displayGlyph),
          ...Array.from(localPicks),
        ]);
        // But for each visible emoji, we need to know the storage key on the
        // server (legacy presets store as "fire" etc., new ones store raw).
        // Group together when display glyph matches.
        const visibleList = Array.from(visible);

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
                      {iconMap[item.type]}
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
                    {visibleList.map((glyph) => {
                      // Find server reaction for this glyph: check raw key + legacy key
                      const legacyKey = Object.entries(LEGACY_GLYPHS).find(
                        ([, g]) => g === glyph
                      )?.[0];
                      const rLegacy = legacyKey
                        ? reactionMap.get(legacyKey)
                        : undefined;
                      const rRaw = reactionMap.get(glyph);
                      const serverCount =
                        (rLegacy?.count ?? 0) + (rRaw?.count ?? 0);
                      const serverReacted =
                        !!rLegacy?.reacted || !!rRaw?.reacted;
                      // The storage key to send on toggle: prefer raw glyph going forward
                      const storageKey = rLegacy && !rRaw ? legacyKey! : glyph;
                      const key: OverrideKey = `${item._id}:${storageKey}`;
                      const override = overrides.get(key);
                      const reacted = override?.reacted ?? serverReacted;
                      const count = Math.max(
                        0,
                        serverCount + (override?.delta ?? 0)
                      );
                      const isTapped = tapped === key;
                      if (count === 0 && !reacted && !DEFAULT_REACTIONS.includes(glyph)) {
                        // Hide empty locally-picked reaction once the optimistic
                        // state clears (e.g. user un-reacted before server confirmed)
                        return null;
                      }
                      return (
                        <button
                          key={glyph}
                          type="button"
                          onClick={() =>
                            handleToggle(
                              item._id as Id<"activityFeed">,
                              storageKey,
                              serverReacted
                            )
                          }
                          aria-pressed={reacted}
                          aria-label={`${glyph} reaction${
                            count > 0 ? `, ${count}` : ""
                          }`}
                          className={[
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs leading-none transition-all duration-150 min-h-[32px] min-w-[32px] select-none touch-manipulation active:scale-95",
                            reacted
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                            isTapped ? "scale-110" : "",
                          ].join(" ")}
                        >
                          <span
                            aria-hidden="true"
                            className={[
                              "text-sm transition-transform duration-150",
                              isTapped ? "-translate-y-0.5" : "",
                            ].join(" ")}
                          >
                            {glyph}
                          </span>
                          {count > 0 && (
                            <span className="tabular-nums">{count}</span>
                          )}
                        </button>
                      );
                    })}
                    <EmojiPicker
                      onPick={(emoji) => handlePick(item._id, emoji)}
                      ariaLabel="React with any emoji"
                    />
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
