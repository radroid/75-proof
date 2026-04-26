"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Cloud,
  Infinity as InfinityIcon,
  Palette,
  Settings,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useGuest } from "@/components/guest-provider";
import { haptic, isHapticsEnabled, setHapticsEnabled } from "@/lib/haptics";
import { formatEndDate, getTodayInTimezone, getUserTimezone } from "@/lib/day-utils";
import {
  useLocalActiveChallenge,
  useLocalUser,
} from "@/lib/local-store/hooks";
import {
  convertToHabitTracker,
  extendChallengeDuration,
  resetAndReOnboard,
  resetKeepingSetup,
  updateDisplayName,
  updateWaterUnit,
} from "@/lib/local-store/mutations";
import {
  detectPermission,
  requestLocalNotificationPermission,
  type LocalPermissionStatus,
} from "@/lib/local-store/notifications";

/**
 * Local-mode settings page. Mirrors the shape of the signed-in settings
 * page but only exposes controls that make sense without an account or
 * server: theme, display name, water unit, haptics, notification
 * permission, challenge length controls, reset paths, and an erase-data
 * affordance. No friend-sharing prefs, no Web Push device list.
 */
export function LocalSettingsPage() {
  const router = useRouter();
  const { promptSignup, resetLocal } = useGuest();
  const user = useLocalUser();
  const challenge = useLocalActiveChallenge();

  const [displayName, setDisplayName] = useState("");
  const [waterUnit, setWaterUnitState] = useState<"oz" | "ml">("oz");
  const [hapticsOn, setHapticsOn] = useState(true);
  const [permissionStatus, setPermissionStatus] =
    useState<LocalPermissionStatus>("default");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHapticsOn(isHapticsEnabled());
    setPermissionStatus(detectPermission());
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setWaterUnitState(user.preferences?.waterUnit ?? "oz");
    }
  }, [user]);

  const currentDaysTotal = challenge?.daysTotal ?? 75;
  const [extendValue, setExtendValue] = useState<string>("");
  useEffect(() => {
    if (challenge && !challenge.isHabitTracker) {
      setExtendValue(String(currentDaysTotal));
    }
  }, [challenge, currentDaysTotal]);

  if (!user) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">No local data yet</h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Finish onboarding first — settings will populate from your local
            profile.
          </p>
          <Button onClick={() => router.push("/onboarding")} size="lg" className="mt-8">
            Go to onboarding
          </Button>
        </div>
      </PageContainer>
    );
  }

  const handleSave = () => {
    if (!displayName.trim()) {
      toast.error("Display name can't be empty");
      return;
    }
    setBusy(true);
    try {
      updateDisplayName(displayName);
      updateWaterUnit(waterUnit);
      toast.success("Settings saved");
    } finally {
      setBusy(false);
    }
  };

  const handleEnableNotifications = async () => {
    setBusy(true);
    try {
      const result = await requestLocalNotificationPermission();
      setPermissionStatus(detectPermission());
      if (result.granted) {
        toast.success("Notifications enabled on this device");
      } else if (Notification.permission === "denied") {
        toast.error("Permission blocked — enable it in your browser settings");
      } else {
        toast.error("Permission not granted");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleExtend = () => {
    if (!challenge) return;
    // `parseInt` would silently accept "90.5" as 90 and "120days" as 120;
    // require the entire value to be a clean integer instead.
    const parsed = Number(extendValue);
    if (!Number.isInteger(parsed)) {
      toast.error("Enter a whole number of days");
      return;
    }
    try {
      extendChallengeDuration({
        challengeId: challenge._id,
        newDaysTotal: parsed,
      });
      toast.success(`Challenge extended to ${parsed} days`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't extend");
    }
  };

  const handleConvert = () => {
    if (!challenge) return;
    try {
      convertToHabitTracker(challenge._id);
      toast.success("Now running as a habit tracker — no end date");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't convert");
    }
  };

  const handleQuickReset = () => {
    if (!challenge) return;
    try {
      const tz = user.preferences?.timezone ?? getUserTimezone();
      const startDate = getTodayInTimezone(tz);
      resetKeepingSetup({
        challengeId: challenge._id,
        failedOnDay: challenge.currentDay,
        startDate,
      });
      toast.success("Progress reset — back to Day 1 with your habits");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to reset progress");
    }
  };

  const handleResetReconfigure = () => {
    if (!challenge) return;
    try {
      resetAndReOnboard({
        challengeId: challenge._id,
        failedOnDay: challenge.currentDay,
      });
      toast.success("Challenge reset — let's reconfigure your habits");
      router.push("/onboarding");
    } catch {
      toast.error("Failed to reset challenge");
    }
  };

  const handleErase = () => {
    resetLocal();
    toast.success("Local data erased");
  };

  return (
    <PageContainer maxWidth="md">
      <PageHeader
        title="Settings"
        description="Local mode — every change is saved on this device only."
      />

      {/* Local-mode notice */}
      <Section>
        <MotionItem>
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-start gap-3 p-5">
              <ShieldCheck className="h-5 w-5 shrink-0 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">You&apos;re in local mode.</p>
                <p className="mt-0.5 text-muted-foreground">
                  Your habits, entries, and preferences are stored only in this
                  browser. Clearing site data or switching browsers will reset
                  this profile. Sign up if you want cloud sync and a backup.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <MotionItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Theme</CardTitle>
              </div>
              <CardDescription>Choose your preferred theme style.</CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSwitcher />
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Profile */}
      <Section title="Profile">
        <MotionItem>
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                  id="display-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="h-11 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Shown only to you — no one else sees this in local mode.
                </p>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <MotionItem>
          <Card>
            <CardContent className="p-5 sm:p-6 space-y-5">
              <div>
                <div className="flex items-center justify-between gap-4 min-h-11">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="haptics-toggle" className="cursor-pointer">
                      Haptic feedback
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Subtle buzz on toggles and completions. Stored on this
                      device.
                    </p>
                  </div>
                  <Switch
                    id="haptics-toggle"
                    checked={hapticsOn}
                    onCheckedChange={(checked) => {
                      setHapticsEnabled(checked);
                      setHapticsOn(checked);
                    }}
                    className="scale-125 origin-right"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => haptic("success")}
                  disabled={!hapticsOn}
                  className="mt-3 min-h-11"
                >
                  Test haptic
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Water unit</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={waterUnit === "oz" ? "default" : "outline"}
                    onClick={() => setWaterUnitState("oz")}
                    aria-pressed={waterUnit === "oz"}
                    className="flex-1 min-h-11"
                  >
                    Ounces (oz)
                  </Button>
                  <Button
                    type="button"
                    variant={waterUnit === "ml" ? "default" : "outline"}
                    onClick={() => setWaterUnitState("ml")}
                    aria-pressed={waterUnit === "ml"}
                    className="flex-1 min-h-11"
                  >
                    Milliliters (ml)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Notifications (local-only) */}
      <Section title="Notifications">
        <MotionItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Browser notifications</CardTitle>
              </div>
              <CardDescription>
                In local mode there&apos;s no server to send pushes from.
                Granting permission lets the app nudge you while it&apos;s
                open in your browser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {permissionStatus === "granted" ? (
                <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  Permission granted on this device.
                </div>
              ) : permissionStatus === "denied" ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  Notifications are blocked by your browser. Enable them in
                  site settings if you change your mind.
                </div>
              ) : permissionStatus === "unsupported" ? (
                <div className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  This browser doesn&apos;t support notifications.
                </div>
              ) : (
                <Button
                  onClick={handleEnableNotifications}
                  disabled={busy}
                  className="min-h-11"
                >
                  Enable notifications
                </Button>
              )}
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Challenge length */}
      {challenge && (
        <Section title="Challenge length">
          <MotionItem>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">Duration</CardTitle>
                </div>
                <CardDescription>
                  Extend your challenge or convert it into an open-ended
                  habit tracker.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-lg border bg-muted/40 p-4">
                  {challenge.isHabitTracker ? (
                    <div className="flex items-center gap-3">
                      <InfinityIcon className="h-5 w-5 text-primary" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Habit tracker mode</p>
                        <p className="text-xs text-muted-foreground">
                          No end date — keep going as long as you like.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium">
                        Day {challenge.currentDay} of {currentDaysTotal}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Ends on {formatEndDate(challenge.startDate, currentDaysTotal)}
                      </p>
                    </div>
                  )}
                </div>

                {!challenge.isHabitTracker && challenge.status !== "failed" && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 sm:pr-4">
                      <p className="font-medium text-sm">Extend challenge</p>
                      <p className="text-xs text-muted-foreground">
                        Add more days. Length can only go up — never down.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full sm:w-auto sm:shrink-0 min-h-11"
                        >
                          Extend
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Extend challenge</AlertDialogTitle>
                          <AlertDialogDescription>
                            Pick a new total length (must be greater than{" "}
                            {currentDaysTotal} and at most 365 days).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-2 py-2">
                          <Label htmlFor="extend-days">New length</Label>
                          <div className="flex items-center gap-3">
                            <Input
                              id="extend-days"
                              type="number"
                              inputMode="numeric"
                              step={1}
                              min={currentDaysTotal + 1}
                              max={365}
                              value={extendValue}
                              onChange={(e) => setExtendValue(e.target.value)}
                              className="h-11 text-base"
                            />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              days
                            </span>
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="min-h-11">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleExtend}
                            className="min-h-11"
                          >
                            Extend
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {!challenge.isHabitTracker && challenge.status !== "failed" && (
                  <>
                    <div className="border-t border-border" />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 sm:pr-4">
                        <p className="font-medium text-sm">Remove end date</p>
                        <p className="text-xs text-muted-foreground">
                          Convert to an open-ended habit tracker. This is
                          permanent.
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto sm:shrink-0 min-h-11"
                          >
                            Convert to tracker
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove the end date?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your challenge will continue indefinitely. Cannot
                              be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="min-h-11">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleConvert}
                              className="min-h-11"
                            >
                              Yes, convert
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </MotionItem>
        </Section>
      )}

      {/* Save */}
      <Section>
        <MotionItem>
          <Button
            onClick={handleSave}
            loading={busy}
            size="lg"
            className="w-full"
          >
            Save changes
          </Button>
        </MotionItem>
      </Section>

      {/* Cloud upgrade */}
      <Section title="Cloud sync">
        <MotionItem>
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 min-w-0">
                <Cloud className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm">Sign up for cloud sync</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Back up your data, sync across devices, and connect with
                    friends. Your existing local data stays on this device.
                  </p>
                </div>
              </div>
              <Button onClick={promptSignup} className="min-h-11 shrink-0">
                Sign up free
              </Button>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Danger zone */}
      <Section title="Danger zone">
        <MotionItem>
          <Card variant="bordered" className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Reset & erase
              </CardTitle>
              <CardDescription>
                Destructive actions only — there&apos;s no undo in local mode.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {challenge && (
                <>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 sm:pr-4">
                      <p className="font-medium">Reset progress</p>
                      <p className="text-sm text-muted-foreground">
                        Back to Day 1 with the same habits.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto sm:shrink-0 min-h-11"
                        >
                          Reset progress
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset progress?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Your current streak ends and a new challenge starts
                            from Day 1 with the same habits. Cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleQuickReset}
                            className="bg-destructive hover:bg-destructive/90 min-h-11"
                          >
                            Yes, reset progress
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="border-t border-destructive/20" />

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 sm:pr-4">
                      <p className="font-medium">Reset & reconfigure</p>
                      <p className="text-sm text-muted-foreground">
                        End the challenge and walk onboarding again to change
                        your habits.
                      </p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto sm:shrink-0 min-h-11"
                        >
                          Reset & reconfigure
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset & reconfigure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ends your current challenge and routes you back
                            through onboarding. Previous choices are pre-filled.
                            Cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleResetReconfigure}
                            className="bg-destructive hover:bg-destructive/90 min-h-11"
                          >
                            Yes, reset & reconfigure
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  <div className="border-t border-destructive/20" />
                </>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 sm:pr-4">
                  <p className="font-medium">Erase all local data</p>
                  <p className="text-sm text-muted-foreground">
                    Wipe the user, challenge, habits, and entries from this
                    browser. Brings you back to the landing page.
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full sm:w-auto sm:shrink-0 min-h-11"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Erase data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Erase all local data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This permanently deletes everything stored in this
                        browser — there&apos;s no backup, no cloud, no recovery.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleErase}
                        className="bg-destructive hover:bg-destructive/90 min-h-11"
                      >
                        Yes, erase everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>
    </PageContainer>
  );
}
