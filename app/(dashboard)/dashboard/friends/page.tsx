"use client";

import { useState } from "react";
import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGuest } from "@/components/guest-provider";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { useFriends } from "@/hooks/use-friends";
import { ActivityFeed } from "@/components/friends/activity-feed";
import { FriendsList } from "@/components/friends/friends-list";
import { RequestsTab } from "@/components/friends/requests-tab";

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

  return <AuthenticatedFriendsPage />;
}

function AuthenticatedFriendsPage() {
  const [activeTab, setActiveTab] = useState("activity");
  const {
    friends,
    pendingRequests,
    sentRequests,
    pendingCount,
    friendProgress,
    friendsFeed,
  } = useFriends();

  // Loading state
  if (friends === undefined) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Friends"
        description="Connect with friends and stay accountable together."
        action={
          <Button size="sm" onClick={() => setActiveTab("friends")}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-sm">
          <TabsTrigger value="activity" className="flex-1">
            Activity
          </TabsTrigger>
          <TabsTrigger value="friends" className="flex-1">
            Friends
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 relative">
            Requests
            {(pendingCount ?? 0) > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="mt-6">
          <ActivityFeed feed={friendsFeed} />
        </TabsContent>

        <TabsContent value="friends" className="mt-6">
          <FriendsList friendProgress={friendProgress as any} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <RequestsTab
            pendingRequests={pendingRequests}
            sentRequests={sentRequests}
          />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
