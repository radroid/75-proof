"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface Options {
  /**
   * When false, every Convex subscription is skipped — used by local-mode
   * (guest) callers on the Progress page so the queries don't fire for
   * users with no auth or friend graph.
   */
  enabled?: boolean;
}

export function useFriends({ enabled = true }: Options = {}) {
  const skip = enabled ? undefined : ("skip" as const);
  const friends = useQuery(api.friends.getFriends, skip);
  const pendingRequests = useQuery(api.friends.getPendingRequests, skip);
  const sentRequests = useQuery(api.friends.getSentRequests, skip);
  const pendingCount = useQuery(api.friends.getPendingRequestCount, skip);
  const friendProgress = useQuery(api.feed.getFriendProgress, skip);
  const friendsFeed = useQuery(api.feed.getFriendsFeed, skip);

  return {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    friendProgress,
    friendsFeed,
  };
}
