"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function useFriends() {
  const friends = useQuery(api.friends.getFriends);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  const sentRequests = useQuery(api.friends.getSentRequests);
  const pendingCount = useQuery(api.friends.getPendingRequestCount);
  const friendProgress = useQuery(api.feed.getFriendProgress);
  const friendsFeed = useQuery(api.feed.getFriendsFeed);

  return {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    friendProgress,
    friendsFeed,
  };
}
