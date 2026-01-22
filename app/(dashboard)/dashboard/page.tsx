"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import { DailyChecklist } from "@/components/DailyChecklist";
import { StartChallengeModal } from "@/components/StartChallengeModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket } from "lucide-react";

export default function DashboardPage() {
  const user = useQuery(api.users.getCurrentUser);
  const createOrGetUser = useMutation(api.users.createOrGetUser);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Create user in Convex if they don't exist
  useEffect(() => {
    if (user === null && !isCreatingUser) {
      setIsCreatingUser(true);
      createOrGetUser().finally(() => setIsCreatingUser(false));
    }
  }, [user, createOrGetUser, isCreatingUser]);

  // Loading state
  if (user === undefined || isCreatingUser) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96 mt-2" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome back{user?.displayName ? `, ${user.displayName}` : ""}!
        </h1>
        <p className="mt-2 text-muted-foreground">
          Track your daily progress and stay on top of your 75 HARD challenge.
        </p>
      </div>

      {user?.currentChallengeId ? (
        <ActiveChallenge userId={user._id} challengeId={user.currentChallengeId} />
      ) : (
        <NoActiveChallenge />
      )}
    </div>
  );
}

function ActiveChallenge({
  userId,
  challengeId,
}: {
  userId: string;
  challengeId: string;
}) {
  const challenge = useQuery(api.challenges.getChallenge, {
    challengeId: challengeId as any,
  });

  if (!challenge) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const progressPercent = (challenge.currentDay / 75) * 100;

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardDescription>Current Progress</CardDescription>
              <CardTitle className="text-4xl mt-1">
                Day {challenge.currentDay}
                <span className="text-lg font-normal text-muted-foreground"> / 75</span>
              </CardTitle>
            </div>
            <div className="text-right">
              <CardDescription>Started</CardDescription>
              <p className="text-lg font-semibold mt-1">
                {new Date(challenge.startDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={progressPercent} className="h-3" />
          <p className="mt-2 text-sm text-muted-foreground">
            {75 - challenge.currentDay} days remaining
          </p>
        </CardContent>
      </Card>

      {/* Daily checklist */}
      <DailyChecklist
        challengeId={challengeId as any}
        userId={userId as any}
        dayNumber={challenge.currentDay}
        date={today}
      />
    </div>
  );
}

function NoActiveChallenge() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Card className="border-2 border-dashed border-emerald-300 dark:border-emerald-800">
        <CardContent className="pt-12 pb-12 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
            <Rocket className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold">Ready to Transform?</h2>
          <p className="mt-2 text-muted-foreground max-w-md mx-auto">
            Begin your 75 HARD journey today. Track your workouts, water intake,
            reading, and build unbreakable mental toughness.
          </p>
          <Button
            onClick={() => setShowModal(true)}
            size="lg"
            className="mt-6 bg-emerald-500 hover:bg-emerald-600"
          >
            Start 75 HARD Challenge
          </Button>
        </CardContent>
      </Card>

      <StartChallengeModal open={showModal} onOpenChange={setShowModal} />
    </>
  );
}
