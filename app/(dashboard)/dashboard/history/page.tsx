"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function HistoryPage() {
  const user = useQuery(api.users.getCurrentUser);
  const challenges = useQuery(
    api.challenges.getUserChallenges,
    user ? { userId: user._id } : "skip"
  );

  if (user === undefined) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Challenge History</h1>
      <p className="mt-2 text-muted-foreground">
        View your past 75 HARD attempts.
      </p>

      <div className="mt-8 space-y-4">
        {challenges?.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">
                No challenge history yet. Start your first challenge!
              </p>
            </CardContent>
          </Card>
        )}

        {challenges?.map((challenge) => (
          <Card key={challenge._id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <Badge
                    variant={
                      challenge.status === "completed"
                        ? "default"
                        : challenge.status === "active"
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      challenge.status === "completed"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : ""
                    }
                  >
                    {challenge.status === "completed"
                      ? "Completed"
                      : challenge.status === "active"
                      ? "Active"
                      : "Failed"}
                  </Badge>
                  <CardDescription className="mt-2">
                    Started {new Date(challenge.startDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    Day {challenge.currentDay}
                    <span className="text-sm font-normal text-muted-foreground"> / 75</span>
                  </p>
                  {challenge.failedOnDay && (
                    <p className="text-sm text-destructive">
                      Ended on Day {challenge.failedOnDay}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress
                value={(challenge.currentDay / 75) * 100}
                className={`h-2 ${
                  challenge.status === "completed"
                    ? "[&>div]:bg-emerald-500"
                    : challenge.status === "active"
                    ? "[&>div]:bg-blue-500"
                    : "[&>div]:bg-red-500"
                }`}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
