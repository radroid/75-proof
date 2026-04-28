"use client";

import { Id } from "@/convex/_generated/dataModel";
import { RequestsTab } from "@/components/friends/requests-tab";
import { FriendSearch } from "@/components/friends/friend-search";

type RequestWithUser = {
  request: {
    _id: Id<"friendships">;
    userId: Id<"users">;
    friendId: Id<"users">;
    status: string;
    createdAt: string;
  };
  user: {
    _id: Id<"users">;
    displayName: string;
    avatarUrl?: string;
  } | null;
};

interface Props {
  pendingRequests: RequestWithUser[] | undefined;
  sentRequests: RequestWithUser[] | undefined;
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
