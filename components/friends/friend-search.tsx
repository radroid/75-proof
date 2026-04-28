"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Check, Clock } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";

type Variant = "compact" | "expanded";

interface Props {
  /**
   * `compact` reproduces the inline search that used to live at the top of
   * `FriendsList`. `expanded` is a roomier "Add a friend" block — used at
   * the bottom of the Progress page so relationship management has a
   * dedicated home next to Requests.
   */
  variant?: Variant;
}

/**
 * Shared search-and-send-friend-request control. Pulled out of
 * `friends-list.tsx` so the Progress page can mount it twice — once
 * compact inline above the friend grid, once expanded above Requests —
 * without duplicating the debounce + query plumbing.
 */
export function FriendSearch({ variant = "compact" }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchResults = useQuery(
    api.friends.searchUsers,
    debouncedTerm.length >= 2 ? { searchTerm: debouncedTerm } : "skip",
  );

  const targetIds = useMemo(
    () => searchResults?.map((u) => u._id) ?? [],
    [searchResults],
  );

  const relationshipStatuses = useQuery(
    api.friends.getRelationshipStatuses,
    targetIds.length > 0 ? { targetUserIds: targetIds } : "skip",
  );

  // Single subscription for the whole result set (was: one per row,
  // which created N identical queries and a race in the Accept handler
  // — `status` could already be `request_received` while the row's
  // own query was still unresolved). Build a `userId → friendshipId`
  // map and hand the relevant id down to each row.
  const pendingRequests = useQuery(api.friends.getPendingRequests);
  const pendingByUserId = useMemo(() => {
    const map = new Map<string, Id<"friendships">>();
    for (const r of pendingRequests ?? []) {
      if (r.user?._id) map.set(String(r.user._id), r.request._id);
    }
    return map;
  }, [pendingRequests]);

  const isExpanded = variant === "expanded";

  return (
    <div className="space-y-3">
      {isExpanded && (
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground">
          Add a friend
        </p>
      )}
      <Input
        type="search"
        placeholder={
          isExpanded
            ? "Search by name to send a friend request"
            : "Search for friends by name..."
        }
        aria-label="Search for friends"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={isExpanded ? "h-12" : "h-11 md:h-9"}
      />

      {searchResults && searchResults.length > 0 && debouncedTerm.length >= 2 && (
        <Card>
          <CardContent className="p-0 divide-y divide-border">
            {searchResults.map((user) => (
              <SearchResultRow
                key={user._id}
                user={user}
                // Pass undefined while the relationship-status query is in
                // flight so the row can suppress its action button until
                // we actually know whether this person is already a
                // friend / has a pending request / etc. Defaulting to
                // "none" used to flash the "Add" button mid-load, which
                // would 409 on send if the relationship already existed.
                status={relationshipStatuses?.[user._id]}
                acceptFriendshipId={pendingByUserId.get(String(user._id))}
                pendingRequestsLoaded={pendingRequests !== undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {searchResults && searchResults.length === 0 && debouncedTerm.length >= 2 && (
        <p className={`text-sm text-muted-foreground ${isExpanded ? "py-6" : "text-center py-4"}`}>
          No users found matching &ldquo;{debouncedTerm}&rdquo;
        </p>
      )}
    </div>
  );
}

function SearchResultRow({
  user,
  status,
  acceptFriendshipId,
  pendingRequestsLoaded,
}: {
  user: { _id: Id<"users">; displayName: string; avatarUrl?: string };
  /**
   * `undefined` while the relationship-status query is loading — the row
   * renders no action button in that case. Defaulting to `"none"` used
   * to flash an Add button that could conflict with an in-flight friend
   * status the server already knew about.
   */
  status:
    | "friends"
    | "request_sent"
    | "request_received"
    | "blocked"
    | "none"
    | undefined;
  /**
   * Pre-resolved friendship id for the inbound request (if any). Hoisted
   * to the parent so we run one `getPendingRequests` subscription per
   * search instead of one per row.
   */
  acceptFriendshipId?: Id<"friendships">;
  /** True once the parent's `getPendingRequests` query has resolved. */
  pendingRequestsLoaded: boolean;
}) {
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      await sendRequest({ toUserId: user._id });
      posthog.capture("friend_request_sent");
      toast.success("Friend request sent!");
    } catch {
      toast.error("Could not send request");
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!acceptFriendshipId) return;
    setLoading(true);
    try {
      await acceptRequest({ friendshipId: acceptFriendshipId });
      toast.success("Friend request accepted!");
    } catch {
      toast.error("Failed to accept request");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-between gap-3 p-3 min-h-[56px]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback className="text-xs">
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-medium text-sm truncate">{user.displayName}</p>
      </div>
      <div className="shrink-0">
        {status === "friends" && (
          <Button variant="outline" size="sm" disabled className="min-h-[44px]">
            <Check className="mr-1 h-3 w-3" /> Friends
          </Button>
        )}
        {status === "request_sent" && (
          <Button variant="outline" size="sm" disabled className="min-h-[44px]">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Button>
        )}
        {status === "request_received" && (
          <Button
            size="sm"
            onClick={handleAccept}
            // Disable until the pending-requests lookup has resolved AND
            // we actually have a friendshipId to act on. Without this
            // gate the user could tap Accept on a row whose backing
            // request hadn't loaded yet, which silently no-op'd before.
            disabled={loading || !pendingRequestsLoaded || !acceptFriendshipId}
            className="min-h-[44px]"
          >
            <Check className="mr-1 h-3 w-3" /> Accept
          </Button>
        )}
        {status === "blocked" && null}
        {status === "none" && (
          <Button size="sm" onClick={handleSend} disabled={loading} className="min-h-[44px]">
            <UserPlus className="mr-1 h-3 w-3" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}
