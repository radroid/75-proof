"use client";

import type { FunctionReturnType } from "convex/server";
import { api } from "@/convex/_generated/api";
import { RequestsTab } from "@/components/friends/requests-tab";
import { FriendSearch } from "@/components/friends/friend-search";

// Derived from the Convex queries `useFriends()` exposes — see the
// matching pattern in `activity-section.tsx`.
type PendingRequests = FunctionReturnType<typeof api.friends.getPendingRequests>;
type SentRequests = FunctionReturnType<typeof api.friends.getSentRequests>;

interface Props {
  pendingRequests: PendingRequests | undefined;
  sentRequests: SentRequests | undefined;
}

/**
 * REQUESTS section. Surfaces a roomier "Add a friend" search block above
 * the received/sent request lists so the bottom of Progress is the
 * relationship-management home — the user explicitly wanted both an
 * inline search inside FRIENDS PROGRESS and a dedicated one here.
 */
export function RequestsSection({ pendingRequests, sentRequests }: Props) {
  return (
    <section aria-labelledby="requests-heading">
      <div className="h-px bg-border mb-8 md:mb-12" />
      <h2
        id="requests-heading"
        className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-6"
      >
        Requests
      </h2>
      <div className="space-y-8">
        <FriendSearch variant="expanded" />
        <RequestsTab
          pendingRequests={pendingRequests}
          sentRequests={sentRequests}
        />
      </div>
    </section>
  );
}
