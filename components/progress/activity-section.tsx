"use client";

import { useMemo, useState } from "react";
import type { FunctionReturnType } from "convex/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { ActivityFeed } from "@/components/friends/activity-feed";
import posthog from "posthog-js";

const COLLAPSED_LIMIT = 5;

// Derived from the Convex queries `useFriends()` exposes — keeps the
// section in lockstep with the hook so backend shape changes show up
// at the page boundary as type errors instead of silent drift.
type FriendsList = FunctionReturnType<typeof api.friends.getFriends>;
type FriendsFeed = FunctionReturnType<typeof api.feed.getFriendsFeed>;

interface Props {
  friendsFeed: FriendsFeed | undefined;
  /**
   * The user's accepted friends — drives the capsule row. When `undefined`
   * we render the feed without capsules (loading state). When empty,
   * `<ActivityFeed>` already shows an "Add friends to see their progress
   * here" empty state.
   */
  friends: FriendsList | undefined;
}

/**
 * ACTIVITY section. Capsule pills above the feed let the user narrow the
 * feed to one or more friends; "Everyone" clears the selection. The feed
 * is truncated to the first 5 items by default with a "See more" expander
 * — surfaces the recent stuff above the fold without scrolling.
 */
export function ActivitySection({ friendsFeed, friends }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(false);

  // Convex returns `Array<T | null>` when one side of a join is missing —
  // strip the nulls once so the JSX below can treat each entry as a real
  // friend record.
  const friendOptions = useMemo(
    () => (friends ?? []).filter((f): f is NonNullable<typeof f> => f !== null),
    [friends],
  );

  const toggle = (friendId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(friendId)) {
        next.delete(friendId);
      } else {
        next.add(friendId);
      }
      posthog.capture("activity_filter_toggled", {
        selected_count: next.size,
        friend_count: friendOptions.length,
      });
      return next;
    });
  };

  const clearFilter = () => {
    if (selected.size === 0) return;
    setSelected(new Set());
    posthog.capture("activity_filter_toggled", {
      selected_count: 0,
      friend_count: friendOptions.length,
    });
  };

  const filteredFeed = useMemo(() => {
    if (!friendsFeed) return undefined;
    if (selected.size === 0) return friendsFeed;
    return friendsFeed.filter((item) => selected.has(String(item.userId)));
  }, [friendsFeed, selected]);

  const visibleFeed = useMemo(() => {
    if (!filteredFeed) return undefined;
    if (expanded) return filteredFeed;
    return filteredFeed.slice(0, COLLAPSED_LIMIT);
  }, [filteredFeed, expanded]);

  const hiddenCount =
    filteredFeed && !expanded
      ? Math.max(0, filteredFeed.length - COLLAPSED_LIMIT)
      : 0;

  // Hide the capsule row entirely when the user has no friends — the feed
  // already renders its own empty state in that case.
  const showCapsules = friendOptions.length > 0;
  const everyoneActive = selected.size === 0;

  return (
    <section id="activity-section" aria-labelledby="activity-heading">
      <div className="h-px bg-border mb-8 md:mb-12" />
      <h2
        id="activity-heading"
        className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-6"
      >
        Activity
      </h2>

      {showCapsules && (
        <div
          className="mb-4 flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter activity by friend"
        >
          <FilterCapsule
            label="Everyone"
            active={everyoneActive}
            onClick={clearFilter}
          />
          {friendOptions.map((f) => (
            <FilterCapsule
              key={f._id}
              label={f.displayName}
              avatarUrl={f.avatarUrl}
              active={selected.has(String(f._id))}
              onClick={() => toggle(String(f._id))}
            />
          ))}
        </div>
      )}

      <ActivityFeed feed={visibleFeed} />

      {hiddenCount > 0 && (
        <div className="mt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            See {hiddenCount} more
            <ChevronDown className="ml-1 h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      {expanded &&
        filteredFeed !== undefined &&
        filteredFeed.length > COLLAPSED_LIMIT && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Show less
              <ChevronUp className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        )}
    </section>
  );
}

function FilterCapsule({
  label,
  avatarUrl,
  active,
  onClick,
}: {
  label: string;
  avatarUrl?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs leading-none min-h-[32px] transition-colors touch-manipulation",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted/40",
      )}
    >
      {avatarUrl !== undefined ? (
        <Avatar className="h-5 w-5">
          <AvatarImage src={avatarUrl} alt="" />
          <AvatarFallback className="text-[9px]">
            {label.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      ) : null}
      <span className="truncate max-w-[120px]">{label}</span>
    </button>
  );
}
