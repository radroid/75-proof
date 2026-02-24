"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FriendProgressCard } from "./friend-progress-card";
import { UserPlus, Check, Clock, Users } from "lucide-react";
import { toast } from "sonner";

interface FriendsListProps {
  friendProgress: Array<{
    user: { _id: Id<"users">; displayName: string; avatarUrl?: string };
    challenge: { currentDay: number | null; startDate: string };
    todayComplete: boolean | null;
  }> | undefined;
}

export function FriendsList({ friendProgress }: FriendsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchResults = useQuery(
    api.friends.searchUsers,
    debouncedTerm.length >= 2 ? { searchTerm: debouncedTerm } : "skip"
  );

  const targetIds = useMemo(
    () => searchResults?.map((u) => u._id) ?? [],
    [searchResults]
  );

  const relationshipStatuses = useQuery(
    api.friends.getRelationshipStatuses,
    targetIds.length > 0 ? { targetUserIds: targetIds } : "skip"
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <Input
        type="text"
        placeholder="Search for friends by name..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Search results */}
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
        <p className="text-sm text-muted-foreground text-center py-4">
          No users found matching &ldquo;{debouncedTerm}&rdquo;
        </p>
      )}

      {/* Friend progress grid */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Friends&apos; Progress
        </h3>
        {!friendProgress || friendProgress.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Add friends to see their progress here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {friendProgress.map((fp) => (
              <FriendProgressCard key={fp.user._id} friend={fp} />
            ))}
          </div>
        )}
      </div>
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
    <div className="flex items-center justify-between p-3">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
          <AvatarFallback className="text-xs">
            {user.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-medium text-sm truncate">{user.displayName}</p>
      </div>
      <div className="flex-shrink-0 ml-2">
        {status === "friends" && (
          <Button variant="outline" size="sm" disabled>
            <Check className="mr-1 h-3 w-3" /> Friends
          </Button>
        )}
        {status === "request_sent" && (
          <Button variant="outline" size="sm" disabled>
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Button>
        )}
        {status === "request_received" && (
          <Button size="sm" onClick={handleAccept} disabled={loading}>
            <Check className="mr-1 h-3 w-3" /> Accept
          </Button>
        )}
        {status === "blocked" && null}
        {status === "none" && (
          <Button size="sm" onClick={handleSend} disabled={loading}>
            <UserPlus className="mr-1 h-3 w-3" /> Add
          </Button>
        )}
      </div>
    </div>
  );
}
