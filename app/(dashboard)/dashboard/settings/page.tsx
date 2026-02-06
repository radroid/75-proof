"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { UserButton } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PageContainer, PageHeader } from "@/components/layout/page-container";
import { Section } from "@/components/layout/section";
import { MotionItem } from "@/components/ui/motion";
import { ThemeSwitcher } from "@/components/theme-switcher";
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
import { AlertTriangle, Palette, Shield } from "lucide-react";

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
  const [showStreak, setShowStreak] = useState(true);
  const [showDayNumber, setShowDayNumber] = useState(true);
  const [showCompletionStatus, setShowCompletionStatus] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setWaterUnit(user.preferences?.waterUnit ?? "oz");
      setShowStreak(user.preferences?.sharing?.showStreak ?? true);
      setShowDayNumber(user.preferences?.sharing?.showDayNumber ?? true);
      setShowCompletionStatus(user.preferences?.sharing?.showCompletionStatus ?? true);
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
          sharing: {
            showStreak,
            showDayNumber,
            showCompletionStatus,
          },
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
          <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
          <div className="h-5 w-48 mt-2 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
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
    <PageContainer maxWidth="md">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />

      {/* Appearance section */}
      <Section title="Appearance">
        <MotionItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Theme</CardTitle>
              </div>
              <CardDescription>
                Choose your preferred theme style.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Profile section */}
      <Section title="Profile">
        <MotionItem>
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
                    className="h-11"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Preferences section */}
      <Section title="Preferences">
        <MotionItem>
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
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Privacy & Sharing section */}
      <Section title="Privacy & Sharing">
        <MotionItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Sharing Preferences</CardTitle>
              </div>
              <CardDescription>
                Control what your friends can see about your challenge.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-streak">Show current streak</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see your consecutive day count
                    </p>
                  </div>
                  <Switch
                    id="show-streak"
                    checked={showStreak}
                    onCheckedChange={setShowStreak}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-day">Show day number</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see what day you&apos;re on
                    </p>
                  </div>
                  <Switch
                    id="show-day"
                    checked={showDayNumber}
                    onCheckedChange={setShowDayNumber}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="show-completion">Show daily completion status</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see if you&apos;ve completed today
                    </p>
                  </div>
                  <Switch
                    id="show-completion"
                    checked={showCompletionStatus}
                    onCheckedChange={setShowCompletionStatus}
                  />
                </div>
                <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                  Progress photos are always private and never shared.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Save button */}
      <Section>
        <MotionItem>
          <Button
            onClick={handleSave}
            loading={isSaving}
            className="w-full"
          >
            Save Changes
          </Button>
        </MotionItem>
      </Section>

      {/* Danger zone */}
      {user.currentChallengeId && (
        <Section title="Danger Zone">
          <MotionItem>
            <Card variant="bordered" className="border-destructive/50 bg-destructive/5">
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
          </MotionItem>
        </Section>
      )}
    </PageContainer>
  );
}
