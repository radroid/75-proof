"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
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
  Palette,
  Play,
  Settings,
  Shield,
  Smartphone,
  Monitor,
  Trash2,
} from "lucide-react";
import { useGuest } from "@/components/guest-provider";
import { sharedUserProfileProps, userButtonPopoverElements } from "@/lib/clerk-appearance";
import { usePushSubscription } from "@/components/pwa/use-push-subscription";
import { haptic, isHapticsEnabled, setHapticsEnabled } from "@/lib/haptics";

export default function SettingsPage() {
  const { isGuest, promptSignup } = useGuest();

  if (isGuest) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Personalize Your Experience</h2>
          <p className="mt-3 text-muted-foreground max-w-md">
            Sign up to access settings, customize your theme, and manage your profile.
          </p>
          <Button onClick={promptSignup} size="lg" className="mt-8">
            Sign Up Free
          </Button>
        </div>
      </PageContainer>
    );
  }
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const updateUser = useMutation(api.users.updateUser);
  const resetAndReOnboard = useMutation(api.challenges.resetAndReOnboard);
  const resetTutorial = useMutation(api.users.resetTutorialSeen);
  const setNotificationPreferences = useMutation(
    api.pushSubscriptions.setNotificationPreferences
  );
  const removeSubscriptionById = useMutation(
    api.pushSubscriptions.removeSubscription
  );
  const mySubs = useQuery(api.pushSubscriptions.listMySubscriptions);
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
    user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip"
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
      toast.success("Challenge reset — let's reconfigure your habits");
      router.push("/onboarding");
    } catch {
      toast.error("Failed to reset challenge");
    }
  };

  const handleReplayTutorial = useCallback(async () => {
    try {
      await resetTutorial();
      router.push("/onboarding/tutorial?from=settings");
    } catch {
      toast.error("Failed to replay tutorial");
    }
  }, [resetTutorial, router]);

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

      {/* Tutorial section */}
      <Section title="Tutorial">
        <MotionItem>
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Play className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm">Replay Tutorial</p>
                    <p className="text-xs text-muted-foreground truncate">
                      Watch the intro video again
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleReplayTutorial}
                  className="min-h-11 shrink-0"
                >
                  Watch
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
                  Reset &amp; Reconfigure
                </CardTitle>
                <CardDescription>
                  End your current challenge and reconfigure your habits through
                  onboarding. Your previous choices will be pre-filled. This action
                  cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto min-h-11">
                      Reset &amp; Reconfigure
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset &amp; Reconfigure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will end your current challenge and take you back through
                        onboarding where you can reconfigure your habits. Your previous
                        choices will be pre-filled. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleResetChallenge}
                        className="bg-destructive hover:bg-destructive/90 min-h-11"
                      >
                        Yes, Reset &amp; Reconfigure
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
