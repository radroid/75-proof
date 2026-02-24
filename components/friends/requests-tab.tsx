"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Inbox, Send } from "lucide-react";
import { toast } from "sonner";

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

interface RequestsTabProps {
  pendingRequests: RequestWithUser[] | undefined;
  sentRequests: RequestWithUser[] | undefined;
}

export function RequestsTab({ pendingRequests, sentRequests }: RequestsTabProps) {
  return (
    <div className="space-y-8">
      {/* Received */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Inbox className="h-4 w-4" />
          Received
        </h3>
        {!pendingRequests || pendingRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No pending requests.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {pendingRequests.map(({ request, user }) => (
              <ReceivedRequestCard
                key={request._id}
                requestId={request._id}
                user={user}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sent */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Send className="h-4 w-4" />
          Sent
        </h3>
        {!sentRequests || sentRequests.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                No outgoing requests.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {sentRequests.map(({ request, user }) => (
              <SentRequestCard
                key={request._id}
                requestId={request._id}
                user={user}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReceivedRequestCard({
  requestId,
  user,
}: {
  requestId: Id<"friendships">;
  user: { _id: Id<"users">; displayName: string; avatarUrl?: string } | null;
}) {
  const acceptRequest = useMutation(api.friends.acceptFriendRequest);
  const declineRequest = useMutation(api.friends.declineFriendRequest);

  if (!user) return null;

  const handleAccept = async () => {
    try {
      await acceptRequest({ friendshipId: requestId });
      toast.success("Friend request accepted!");
    } catch {
      toast.error("Failed to accept request");
    }
  };

  const handleDecline = async () => {
    try {
      await declineRequest({ friendshipId: requestId });
      toast.success("Request declined");
    } catch {
      toast.error("Failed to decline request");
    }
  };

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback className="text-xs">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-sm truncate">{user.displayName}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-2">
            <Button onClick={handleAccept} size="sm" variant="success">
              Accept
            </Button>
            <Button onClick={handleDecline} variant="outline" size="sm">
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SentRequestCard({
  requestId,
  user,
}: {
  requestId: Id<"friendships">;
  user: { _id: Id<"users">; displayName: string; avatarUrl?: string } | null;
}) {
  const cancelRequest = useMutation(api.friends.declineFriendRequest);

  if (!user) return null;

  const handleCancel = async () => {
    try {
      await cancelRequest({ friendshipId: requestId });
      toast.success("Request cancelled");
    } catch {
      toast.error("Failed to cancel request");
    }
  };

  return (
    <Card>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback className="text-xs">
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium text-sm truncate">{user.displayName}</p>
          </div>
          <Button onClick={handleCancel} variant="outline" size="sm" className="flex-shrink-0 ml-2">
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
