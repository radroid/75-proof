"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const user = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateUser);
  const failChallenge = useMutation(api.challenges.failChallenge);
  const challenge = useQuery(
    api.challenges.getChallenge,
    user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip"
  );

  const [displayName, setDisplayName] = useState("");
  const [waterUnit, setWaterUnit] = useState<"oz" | "ml">("oz");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setWaterUnit(user.preferences?.waterUnit ?? "oz");
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUser({
        displayName,
        preferences: {
          timezone: user?.preferences?.timezone ?? "America/New_York",
          waterUnit,
        },
      });
      toast.success("Settings saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetChallenge = async () => {
    if (!user?.currentChallengeId || !challenge) return;
    try {
      await failChallenge({
        challengeId: user.currentChallengeId,
        failedOnDay: challenge.currentDay,
      });
      toast.success("Challenge has been reset");
    } catch {
      toast.error("Failed to reset challenge");
    }
  };

  if (user === undefined) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-5 w-48 mt-2" />
        </div>
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">
        Manage your account and preferences.
      </p>

      {/* Profile section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Profile</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-6">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-16 h-16",
                  },
                }}
              />
              <div>
                <p className="text-sm text-muted-foreground">
                  Click to manage your Clerk account
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preferences section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Water Unit</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={waterUnit === "oz" ? "default" : "outline"}
                    onClick={() => setWaterUnit("oz")}
                    className="flex-1"
                  >
                    Ounces (oz)
                  </Button>
                  <Button
                    type="button"
                    variant={waterUnit === "ml" ? "default" : "outline"}
                    onClick={() => setWaterUnit("ml")}
                    className="flex-1"
                  >
                    Milliliters (ml)
                  </Button>
                </div>
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="mt-6 w-full"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Danger zone */}
      {user.currentChallengeId && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-destructive mb-4">
            Danger Zone
          </h2>
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Reset Challenge
              </CardTitle>
              <CardDescription>
                If you missed a requirement, you need to restart from Day 1. This
                action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">Reset My Challenge</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark your current challenge as failed and you&apos;ll
                      need to start a new one from Day 1. This action cannot be
                      undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleResetChallenge}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Yes, Reset Challenge
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
