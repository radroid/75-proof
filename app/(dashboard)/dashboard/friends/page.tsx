"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { useGuest } from "@/components/guest-provider";
import { PageContainer } from "@/components/layout/page-container";

export default function FriendsPage() {
  const { isGuest, promptSignup } = useGuest();

  if (isGuest) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Connect with Friends</h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Sign up to connect with friends, see their progress, and stay accountable together.
          </p>
          <Button onClick={promptSignup} size="lg" className="mt-8">
            Sign Up Free
          </Button>
        </div>
      </PageContainer>
    );
  }
  const user = useQuery(api.users.getCurrentUser);
  const friends = useQuery(
    api.friends.getFriends,
    user ? { userId: user._id } : "skip"
  );
  const pendingRequests = useQuery(
    api.friends.getPendingRequests,
    user ? { userId: user._id } : "skip"
  );
  const friendProgress = useQuery(
    api.feed.getFriendProgress,
    user ? { userId: user._id } : "skip"
  );

  const [searchTerm, setSearchTerm] = useState("");
  const searchResults = useQuery(
    api.friends.searchUsers,
    searchTerm.length >= 2 ? { searchTerm } : "skip"
  );

  if (user === undefined) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Friends</h1>
      <p className="mt-2 text-muted-foreground">
        Connect with friends and stay accountable together.
      </p>

      {/* Search */}
      <div className="mt-8">
        <Input
          type="text"
          placeholder="Search for friends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        {searchResults && searchResults.length > 0 && (
          <Card className="mt-2">
            <CardContent className="p-0 divide-y">
              {searchResults
                .filter((u) => u._id !== user?._id)
                .map((searchUser) => (
                  <SearchResult
                    key={searchUser._id}
                    searchUser={searchUser}
                    currentUserId={user?._id}
                  />
                ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pending requests */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Pending Requests</h2>
          <div className="space-y-2">
            {pendingRequests.map(({ request, user: requester }) => (
              <PendingRequest
                key={request._id}
                requestId={request._id}
                user={requester}
              />
            ))}
          </div>
        </div>
      )}

      {/* Friend progress */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Friends&apos; Progress</h2>
        {friendProgress?.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                Add friends to see their progress here.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {friendProgress?.filter((friend) => friend !== null).map((friend) => (
            <Card key={friend!.user._id}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend!.user.avatarUrl} alt={friend!.user.displayName} />
                    <AvatarFallback>
                      {friend!.user.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{friend!.user.displayName}</p>
                    <p className="text-sm text-muted-foreground">
                      {friend!.challenge.currentDay != null
                        ? `Day ${friend!.challenge.currentDay} / 75`
                        : "Challenge in progress"}
                    </p>
                  </div>
                  {friend!.todayComplete && (
                    <div className="h-6 w-6 rounded-full bg-success/10 flex items-center justify-center">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                  )}
                </div>
                {friend!.challenge.currentDay != null && (
                  <Progress
                    value={(friend!.challenge.currentDay / 75) * 100}
                    className="mt-3 h-2"
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All friends */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">
          All Friends ({friends?.length ?? 0})
        </h2>
        <div className="space-y-2">
          {friends?.map((friend) => (
            <Card key={friend?._id}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={friend?.avatarUrl} alt={friend?.displayName} />
                    <AvatarFallback>
                      {friend?.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-medium">{friend?.displayName}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResult({
  searchUser,
  currentUserId,
}: {
  searchUser: { _id: Id<"users">; displayName: string; avatarUrl?: string };
  currentUserId?: Id<"users">;
}) {
  const sendRequest = useMutation(api.friends.sendFriendRequest);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!currentUserId) return;
    try {
      await sendRequest({
        fromUserId: currentUserId,
        toUserId: searchUser._id,
      });
      setSent(true);
      toast.success("Friend request sent!");
    } catch {
      toast.error("Could not send request");
    }
  };

  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={searchUser.avatarUrl} alt={searchUser.displayName} />
          <AvatarFallback>
            {searchUser.displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <p className="font-medium">{searchUser.displayName}</p>
      </div>
      <Button
        onClick={handleSend}
        disabled={sent}
        size="sm"
      >
        {sent ? (
          <>
            <Check className="mr-1 h-4 w-4" /> Sent
          </>
        ) : (
          <>
            <UserPlus className="mr-1 h-4 w-4" /> Add
          </>
        )}
      </Button>
    </div>
  );
}

function PendingRequest({
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
      toast.success("Friend request declined");
    } catch {
      toast.error("Failed to decline request");
    }
  };

  return (
    <Card>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
              <AvatarFallback>
                {user.displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="font-medium">{user.displayName}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAccept}
              size="sm"
              variant="success"
            >
              Accept
            </Button>
            <Button
              onClick={handleDecline}
              variant="outline"
              size="sm"
            >
              Decline
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
