"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import posthog from "posthog-js";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
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
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Infinity as InfinityIcon,
  Palette,
  Play,
  Settings,
  Shield,
  Smartphone,
  Monitor,
  Trash2,
} from "lucide-react";
import { useGuest } from "@/components/guest-provider";
import { LocalSettingsPage } from "@/components/local-settings";
import { CoachPrivacySettings } from "@/components/coach/CoachPrivacySettings";
import { sharedUserProfileProps, userButtonPopoverElements } from "@/lib/clerk-appearance";
import { usePushSubscription } from "@/components/pwa/use-push-subscription";
import { haptic, isHapticsEnabled, setHapticsEnabled } from "@/lib/haptics";
import { formatEndDate } from "@/lib/day-utils";

export default function SettingsPage() {
  // Hooks must run in a stable order on every render — branching before they
  // execute crashes Strict Mode (and iOS WebKit) on the second mount. Compute
  // `isGuest` up front, run all hooks unconditionally below, and switch the
  // rendered UI at the end based on the flag.
  const { isGuest, promptSignup } = useGuest();
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser, isGuest ? "skip" : {});
  const updateUser = useMutation(api.users.updateUser);
  const resetAndReOnboard = useMutation(api.challenges.resetAndReOnboard);
  const resetKeepingSetup = useMutation(api.challenges.resetKeepingSetup);
  const updateChallengeDuration = useMutation(api.challenges.updateChallengeDuration);
  const convertToHabitTracker = useMutation(api.challenges.convertToHabitTracker);
  const resetTutorial = useMutation(api.users.resetTutorialSeen);
  const setNotificationPreferences = useMutation(
    api.pushSubscriptions.setNotificationPreferences
  );
  const removeSubscriptionById = useMutation(
    api.pushSubscriptions.removeSubscription
  );
  const mySubs = useQuery(
    api.pushSubscriptions.listMySubscriptions,
    isGuest ? "skip" : {},
  );
  const {
    status: pushStatus,
    isSubscribed,
    requiresInstall,
    missingVapidKey,
    currentEndpoint,
    requestPermission,
    unsubscribe,
  } = usePushSubscription();
  const challenge = useQuery(
    api.challenges.getChallenge,
    !isGuest && user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip",
  );

  const [displayName, setDisplayName] = useState("");
  const [waterUnit, setWaterUnit] = useState<"oz" | "ml">("oz");
  // Device-local: haptics preference lives in localStorage (not Convex) so
  // users can toggle it per-device without needing auth. Default to the
  // last stored value, falling back to "on" — hydrate on mount to avoid
  // SSR/client mismatch.
  const [hapticsOn, setHapticsOn] = useState(true);
  const [showStreak, setShowStreak] = useState(true);
  const [showDayNumber, setShowDayNumber] = useState(true);
  const [showCompletionStatus, setShowCompletionStatus] = useState(true);
  const [showHabits, setShowHabits] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Notification prefs
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [morningReminder, setMorningReminder] = useState(true);
  const [eveningReminder, setEveningReminder] = useState(true);
  const [morningTime, setMorningTime] = useState("08:00");
  const [eveningTime, setEveningTime] = useState("20:00");
  const [nudgesNotif, setNudgesNotif] = useState(true);
  const [reactionsNotif, setReactionsNotif] = useState(true);
  const notifHydrated = useRef(false);

  useEffect(() => {
    setHapticsOn(isHapticsEnabled());
  }, []);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setWaterUnit(user.preferences?.waterUnit ?? "oz");
      setShowStreak(user.preferences?.sharing?.showStreak ?? true);
      setShowDayNumber(user.preferences?.sharing?.showDayNumber ?? true);
      setShowCompletionStatus(user.preferences?.sharing?.showCompletionStatus ?? true);
      setShowHabits(user.preferences?.sharing?.showHabits ?? true);
      const n = user.preferences?.notifications;
      setNotifEnabled(n?.enabled ?? false);
      setMorningReminder(n?.morningReminder ?? true);
      setEveningReminder(n?.eveningReminder ?? true);
      setMorningTime(n?.morningTime ?? "08:00");
      setEveningTime(n?.eveningTime ?? "20:00");
      setNudgesNotif(n?.nudges ?? true);
      setReactionsNotif(n?.reactions ?? true);
      notifHydrated.current = true;
    }
  }, [user]);

  // Debounced autosave for notification preferences. We fire-and-forget so
  // the user doesn't see a toast on every tap — the persistence mirrors the
  // optimistic local state.
  const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
  useEffect(() => {
    if (!user || !notifHydrated.current) return;
    if (!TIME_RE.test(morningTime) || !TIME_RE.test(eveningTime)) return;
    const t = setTimeout(() => {
      setNotificationPreferences({
        enabled: notifEnabled,
        morningReminder,
        eveningReminder,
        morningTime,
        eveningTime,
        nudges: nudgesNotif,
        reactions: reactionsNotif,
      }).catch(() => {
        toast.error("Couldn't save notification preferences");
      });
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    notifEnabled,
    morningReminder,
    eveningReminder,
    morningTime,
    eveningTime,
    nudgesNotif,
    reactionsNotif,
  ]);

  const handleEnableInBrowser = useCallback(async () => {
    const res = await requestPermission();
    if (res.granted) {
      toast.success("Notifications enabled on this device");
    } else if (missingVapidKey) {
      toast.error("Push is not configured on this deployment");
    } else {
      toast.error("Permission not granted");
    }
  }, [requestPermission, missingVapidKey]);

  const handleUnsubscribeDevice = useCallback(async () => {
    await unsubscribe();
    toast.success("This device will no longer receive reminders");
  }, [unsubscribe]);

  const handleRemoveSubscription = useCallback(
    async (endpoint: string) => {
      try {
        await removeSubscriptionById({ endpoint });
        toast.success("Device removed");
      } catch {
        toast.error("Couldn't remove device");
      }
    },
    [removeSubscriptionById]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // IMPORTANT: `preferences` in the schema is a single object and
      // `updateUser` replaces it wholesale (ctx.db.patch does a shallow
      // merge at the top level only). If we omit `notifications` here, the
      // debounced autosave that just persisted the user's toggle gets
      // clobbered. Preserve it by passing through whatever's currently on
      // the user doc — the dedicated `setNotificationPreferences` mutation
      // owns writes to that sub-object.
      await updateUser({
        displayName,
        preferences: {
          timezone: user?.preferences?.timezone ?? "America/New_York",
          reminderTime: user?.preferences?.reminderTime,
          waterUnit,
          sharing: {
            showStreak,
            showDayNumber,
            showCompletionStatus,
            showHabits,
          },
          notifications: user?.preferences?.notifications,
        },
      });
      posthog.capture("settings_saved", { water_unit: waterUnit });
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
      await resetAndReOnboard({
        challengeId: user.currentChallengeId,
        failedOnDay: challenge.currentDay,
      });
      posthog.capture("challenge_reset_reconfigure", {
        failed_on_day: challenge.currentDay,
      });
      toast.success("Challenge reset — let's reconfigure your habits");
      router.push("/onboarding");
    } catch {
      toast.error("Failed to reset challenge");
    }
  };

  const handleQuickReset = async () => {
    if (!user?.currentChallengeId || !challenge) return;
    try {
      const tz = user.preferences?.timezone ?? "UTC";
      const startDate = new Date().toLocaleDateString("en-CA", {
        timeZone: tz,
      });
      await resetKeepingSetup({
        challengeId: user.currentChallengeId,
        failedOnDay: challenge.currentDay,
        startDate,
      });
      posthog.capture("challenge_reset_progress", {
        failed_on_day: challenge.currentDay,
      });
      toast.success("Progress reset — back to Day 1 with your habits");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to reset progress");
    }
  };

  const handleReplayTutorial = useCallback(async () => {
    try {
      await resetTutorial();
      posthog.capture("tour_replay_requested");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to replay tour");
    }
  }, [resetTutorial, router]);

  // Challenge duration controls — local state for the "extend" dialog input.
  // Pre-fill with the current target so a small bump is the easiest action.
  const currentDaysTotal = challenge?.daysTotal ?? 75;
  const [extendValue, setExtendValue] = useState<string>("");
  useEffect(() => {
    if (challenge && !challenge.isHabitTracker) {
      setExtendValue(String(currentDaysTotal));
    }
  }, [challenge, currentDaysTotal]);

  const handleExtendDuration = async () => {
    if (!user?.currentChallengeId) return;
    const parsed = parseInt(extendValue, 10);
    if (Number.isNaN(parsed)) {
      toast.error("Enter a valid number of days");
      return;
    }
    try {
      await updateChallengeDuration({
        challengeId: user.currentChallengeId,
        newDaysTotal: parsed,
      });
      posthog.capture("challenge_duration_extended", {
        from_days: currentDaysTotal,
        to_days: parsed,
      });
      toast.success(`Challenge extended to ${parsed} days`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't extend challenge"
      );
    }
  };

  const handleConvertToHabitTracker = async () => {
    if (!user?.currentChallengeId) return;
    try {
      await convertToHabitTracker({ challengeId: user.currentChallengeId });
      posthog.capture("challenge_converted_to_habit_tracker", {
        from_days: currentDaysTotal,
      });
      toast.success("Now running as a habit tracker — no end date");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't convert challenge"
      );
    }
  };

  if (isGuest) {
    return <LocalSettingsPage />;
  }

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

      {/* Tour section */}
      <Section title="Tour">
        <MotionItem>
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Replay Tour</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Show the dashboard walkthrough again
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReplayTutorial}
                  className="min-h-11 shrink-0"
                >
                  Replay
                </Button>
              </div>
            </CardContent>
          </Card>
        </MotionItem>
      </Section>

      {/* Profile section */}
      <Section title="Profile">
        <MotionItem>
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-4 mb-6">
                <UserButton
                  userProfileProps={sharedUserProfileProps}
                  appearance={{
                    elements: {
                      avatarBox: "w-14 h-14 sm:w-16 sm:h-16",
                      ...userButtonPopoverElements,
                    },
                  }}
                />
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">
                    Tap your avatar to manage your account
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
                    className="h-11 text-base"
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
            <CardContent className="p-5 sm:p-6">
              <div className="space-y-5">
                {/* Haptics (device-local) */}
                <div>
                  <div className="flex items-center justify-between gap-4 min-h-11">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="haptics-toggle" className="cursor-pointer">
                        Haptic feedback
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Subtle buzz on toggles, taps, and completions. Stored
                        only on this device.
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
                  <Label>Water Unit</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={waterUnit === "oz" ? "default" : "outline"}
                      onClick={() => setWaterUnit("oz")}
                      aria-pressed={waterUnit === "oz"}
                      className="flex-1 min-h-11"
                    >
                      Ounces (oz)
                    </Button>
                    <Button
                      type="button"
                      variant={waterUnit === "ml" ? "default" : "outline"}
                      onClick={() => setWaterUnit("ml")}
                      aria-pressed={waterUnit === "ml"}
                      className="flex-1 min-h-11"
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

      {/* Challenge length section */}
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
                  Extend your challenge or convert it into an open-ended habit
                  tracker.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Current state */}
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
                        Ends on{" "}
                        {formatEndDate(challenge.startDate, currentDaysTotal)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Extend */}
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
                            onClick={handleExtendDuration}
                            className="min-h-11"
                          >
                            Extend
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}

                {/* Convert to habit tracker */}
                {!challenge.isHabitTracker && challenge.status !== "failed" && (
                  <>
                    <div className="border-t border-border" />
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 sm:pr-4">
                        <p className="font-medium text-sm">Remove end date</p>
                        <p className="text-xs text-muted-foreground">
                          Convert to an open-ended habit tracker. This is
                          permanent — there&apos;s no going back to a fixed
                          length.
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
                            <AlertDialogTitle>
                              Remove the end date?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Your challenge will continue indefinitely as a
                              habit tracker. You&apos;ll keep your day counter
                              and habits, but completion will no longer fire.
                              This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="min-h-11">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleConvertToHabitTracker}
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
              <div className="divide-y divide-border -my-2">
                <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="show-streak" className="cursor-pointer">
                      Show current streak
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see your consecutive day count
                    </p>
                  </div>
                  <Switch
                    id="show-streak"
                    checked={showStreak}
                    onCheckedChange={setShowStreak}
                    className="scale-125 origin-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="show-day" className="cursor-pointer">
                      Show day number
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see what day you&apos;re on
                    </p>
                  </div>
                  <Switch
                    id="show-day"
                    checked={showDayNumber}
                    onCheckedChange={setShowDayNumber}
                    className="scale-125 origin-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="show-completion" className="cursor-pointer">
                      Show daily completion status
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see if you&apos;ve completed today
                    </p>
                  </div>
                  <Switch
                    id="show-completion"
                    checked={showCompletionStatus}
                    onCheckedChange={setShowCompletionStatus}
                    className="scale-125 origin-right"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="show-habits" className="cursor-pointer">
                      Show habits
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Let friends see which habits you&apos;re tracking
                    </p>
                  </div>
                  <Switch
                    id="show-habits"
                    checked={showHabits}
                    onCheckedChange={setShowHabits}
                    className="scale-125 origin-right"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border">
                Progress photos are always private and never shared.
              </p>
            </CardContent>
          </Card>
        </MotionItem>
        <MotionItem>
          <CoachPrivacySettings />
        </MotionItem>
      </Section>

      {/* Notifications section */}
      <Section title="Notifications">
        <MotionItem>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Daily Reminders</CardTitle>
              </div>
              <CardDescription>
                Get nudges to finish your habits each day. Runs on your phone or
                desktop while the browser is installed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border -my-2">
                {/* Master switch */}
                <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="notif-enabled" className="cursor-pointer">
                      Daily reminders
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Master switch for morning and evening nudges
                    </p>
                  </div>
                  <Switch
                    id="notif-enabled"
                    checked={notifEnabled}
                    onCheckedChange={setNotifEnabled}
                    className="scale-125 origin-right"
                  />
                </div>

                {/* Morning reminder */}
                <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="morning-reminder" className="cursor-pointer">
                      Morning nudge
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kick off the day on time
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="time"
                      step={900}
                      value={morningTime}
                      onChange={(e) => setMorningTime(e.target.value)}
                      disabled={!notifEnabled || !morningReminder}
                      aria-label="Morning reminder time"
                      className="h-11 text-base w-[7.5rem]"
                    />
                    <Switch
                      id="morning-reminder"
                      checked={morningReminder}
                      onCheckedChange={setMorningReminder}
                      disabled={!notifEnabled}
                      className="scale-125 origin-right"
                    />
                  </div>
                </div>

                {/* Evening reminder */}
                <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="evening-reminder" className="cursor-pointer">
                      Evening check-in
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Last call to log remaining habits
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      type="time"
                      step={900}
                      value={eveningTime}
                      onChange={(e) => setEveningTime(e.target.value)}
                      disabled={!notifEnabled || !eveningReminder}
                      aria-label="Evening reminder time"
                      className="h-11 text-base w-[7.5rem]"
                    />
                    <Switch
                      id="evening-reminder"
                      checked={eveningReminder}
                      onCheckedChange={setEveningReminder}
                      disabled={!notifEnabled}
                      className="scale-125 origin-right"
                    />
                  </div>
                </div>

                {/* Permission / subscription status row */}
                <div className="py-3">
                  {missingVapidKey ? (
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      Push is not configured on this deployment. Contact the
                      team.
                    </div>
                  ) : requiresInstall ? (
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      Add 75 Proof to your home screen to receive reminders on
                      iOS. Tap the share icon in Safari, then{" "}
                      <span className="font-medium">Add to Home Screen</span>.
                    </div>
                  ) : pushStatus === "denied" ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
                      Notifications are blocked by your browser. Enable them in
                      your site settings to receive reminders.
                    </div>
                  ) : pushStatus === "granted" && isSubscribed ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Notifications active on this device
                      </p>
                      <Button
                        variant="outline"
                        onClick={handleUnsubscribeDevice}
                        className="min-h-11"
                      >
                        Remove this device
                      </Button>
                    </div>
                  ) : pushStatus === "default" && notifEnabled ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        Allow this browser to send reminders.
                      </p>
                      <Button
                        onClick={handleEnableInBrowser}
                        className="min-h-11"
                      >
                        Enable in browser
                      </Button>
                    </div>
                  ) : pushStatus === "unsupported" ? (
                    <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                      This browser does not support push notifications.
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Friend activity subsection */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium mb-1">From friends</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Push alerts when friends interact with you
                </p>
                <div className="divide-y divide-border -my-2">
                  <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                    <div className="min-w-0 flex-1">
                      <Label htmlFor="notif-nudges" className="cursor-pointer">
                        Nudges
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When a friend sends you a nudge
                      </p>
                    </div>
                    <Switch
                      id="notif-nudges"
                      checked={nudgesNotif}
                      onCheckedChange={setNudgesNotif}
                      disabled={!notifEnabled}
                      className="scale-125 origin-right"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-4 min-h-11 py-3">
                    <div className="min-w-0 flex-1">
                      <Label
                        htmlFor="notif-reactions"
                        className="cursor-pointer"
                      >
                        Reactions
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When a friend reacts to your activity
                      </p>
                    </div>
                    <Switch
                      id="notif-reactions"
                      checked={reactionsNotif}
                      onCheckedChange={setReactionsNotif}
                      disabled={!notifEnabled}
                      className="scale-125 origin-right"
                    />
                  </div>
                </div>
              </div>

              {/* Device list */}
              {mySubs && mySubs.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm font-medium mb-3">Active devices</p>
                  <ul className="space-y-2">
                    {mySubs.map((sub) => {
                      const PlatformIcon =
                        sub.platform === "desktop" ? Monitor : Smartphone;
                      const platformLabel =
                        sub.platform === "ios"
                          ? "iOS"
                          : sub.platform === "android"
                            ? "Android"
                            : "Desktop";
                      const lastSeen = new Date(
                        sub.lastSeenAt
                      ).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      });
                      const isThisDevice =
                        currentEndpoint !== null &&
                        sub.endpoint === currentEndpoint;
                      return (
                        <li
                          key={sub._id}
                          className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 ${
                            isThisDevice
                              ? "border border-primary/30 bg-primary/5"
                              : "bg-muted/40"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-md bg-background flex items-center justify-center shrink-0">
                              <PlatformIcon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate flex items-center gap-2">
                                <span>{platformLabel}</span>
                                {isThisDevice && (
                                  <span className="inline-flex items-center rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                    This device
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Last seen {lastSeen}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={
                              isThisDevice
                                ? "Remove this device"
                                : "Remove device"
                            }
                            onClick={() => handleRemoveSubscription(sub.endpoint)}
                            className="min-h-11 min-w-11 shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
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
            size="lg"
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
                  Reset challenge
                </CardTitle>
                <CardDescription>
                  Starting over? Pick how much you want to redo.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 sm:pr-4">
                    <p className="font-medium">Reset progress</p>
                    <p className="text-sm text-muted-foreground">
                      Back to Day 1 with the same habits. Fastest way to
                      start over.
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
                          Your current streak will end and a new challenge will
                          start from Day 1 with the same habits. This cannot be
                          undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-11">
                          Cancel
                        </AlertDialogCancel>
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
                    <p className="font-medium">Reset &amp; reconfigure</p>
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
                        Reset &amp; reconfigure
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reset &amp; reconfigure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will end your current challenge and take you back
                          through onboarding where you can reconfigure your
                          habits. Your previous choices will be pre-filled. This
                          action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="min-h-11">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetChallenge}
                          className="bg-destructive hover:bg-destructive/90 min-h-11"
                        >
                          Yes, reset &amp; reconfigure
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </MotionItem>
        </Section>
      )}
    </PageContainer>
  );
}
