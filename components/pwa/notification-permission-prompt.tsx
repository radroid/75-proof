"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePushSubscription } from "./use-push-subscription";

const DISMISS_KEY = "75proof_notif_prompt_dismissed_at";
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function readDismissedAt(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return null;
    const ts = Date.parse(raw);
    return Number.isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

function writeDismissedAt(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
  } catch {
    // Ignore storage errors — we'll just re-ask next visit.
  }
}

function isWithinDismissWindow(): boolean {
  const ts = readDismissedAt();
  if (ts === null) return false;
  return Date.now() - ts < DISMISS_WINDOW_MS;
}

export type NotificationPermissionPromptProps = {
  /**
   * Gate: only show once this is true. Intended to be wired to something
   * like "user completed ≥1 habit today" or "second dashboard visit" so
   * we don't prompt cold visitors.
   */
  enabled: boolean;
};

export function NotificationPermissionPrompt({
  enabled,
}: NotificationPermissionPromptProps) {
  const {
    status,
    isSubscribed,
    requiresInstall,
    missingVapidKey,
    requestPermission,
  } = usePushSubscription();
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDismissed(isWithinDismissWindow());
  }, []);

  const onEnable = useCallback(async () => {
    setBusy(true);
    try {
      await requestPermission();
    } finally {
      setBusy(false);
    }
  }, [requestPermission]);

  const onDismiss = useCallback(() => {
    writeDismissedAt();
    setDismissed(true);
  }, []);

  if (!enabled) return null;
  if (dismissed) return null;
  if (missingVapidKey) return null;
  if (status === "loading") return null;
  if (status === "denied") return null;
  if (isSubscribed) return null;

  // iOS in Safari tab: show a gentle tip instead of a permission request,
  // since Web Push only works inside an installed PWA.
  if (status === "unsupported" && requiresInstall) {
    return (
      <Card
        role="region"
        aria-label="Enable reminders tip"
        className="border-primary/30 bg-primary/5"
      >
        <CardContent className="flex items-start gap-3 py-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15"
            aria-hidden="true"
          >
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 text-sm">
            <p className="font-medium text-foreground">
              Add to Home Screen first to enable reminders
            </p>
            <p className="mt-0.5 text-muted-foreground">
              iOS only delivers push notifications to installed apps.
            </p>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </CardContent>
      </Card>
    );
  }

  if (status === "unsupported") return null;

  return (
    <Card
      role="region"
      aria-label="Enable daily reminders"
      className="border-primary/30 bg-primary/5"
    >
      <CardContent className="flex items-start gap-3 py-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15"
          aria-hidden="true"
        >
          <Bell className="h-4 w-4 text-primary" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium text-foreground">Get daily reminders?</p>
          <p className="mt-0.5 text-muted-foreground">
            Enable notifications to nudge you morning and evening.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={onEnable}
              disabled={busy}
            >
              {busy ? "Enabling..." : "Enable reminders"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={onDismiss}
              disabled={busy}
            >
              Not now
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
