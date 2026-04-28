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
                status={relationshipStatuses?.[user._id] ?? "none"}
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
}: {
  user: { _id: Id<"users">; displayName: string; avatarUrl?: string };
  status: "friends" | "request_sent" | "request_received" | "blocked" | "none";
}) {
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const pendingRequests = useQuery(api.friends.getPendingRequests);
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
    const req = pendingRequests?.find((r) => r.user?._id === user._id);
    if (!req) return;
    setLoading(true);
    try {
      await acceptRequest({ friendshipId: req.request._id });
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
          <Button size="sm" onClick={handleAccept} disabled={loading} className="min-h-[44px]">
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
