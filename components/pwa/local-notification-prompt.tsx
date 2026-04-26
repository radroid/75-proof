"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  detectPermission,
  requestLocalNotificationPermission,
  type LocalPermissionStatus,
} from "@/lib/local-store/notifications";

const DISMISS_KEY = "75proof_local_notif_prompt_dismissed_at";
const DISMISS_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

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
    /* noop */
  }
}

function isWithinDismissWindow(): boolean {
  const ts = readDismissedAt();
  if (ts === null) return false;
  return Date.now() - ts < DISMISS_WINDOW_MS;
}

interface LocalNotificationPromptProps {
  enabled: boolean;
}

/**
 * Local-mode notification prompt. Asks for browser notification permission
 * and persists the grant in the local store. We do NOT register a Web Push
 * subscription — local mode has no server endpoint to deliver from, and
 * registering one would defeat the privacy guarantee. Granting permission
 * is recorded so the user can grant/deny once and the prompt stays away.
 */
export function LocalNotificationPrompt({ enabled }: LocalNotificationPromptProps) {
  const [status, setStatus] = useState<LocalPermissionStatus>("default");
  const [dismissed, setDismissed] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStatus(detectPermission());
    setDismissed(isWithinDismissWindow());
  }, []);

  const onEnable = useCallback(async () => {
    setBusy(true);
    try {
      const result = await requestLocalNotificationPermission();
      setStatus(detectPermission());
      if (result.granted) {
        // Confirmation toast is handled by the parent; nothing else to do —
        // the local store mutation already recorded the grant.
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const onDismiss = useCallback(() => {
    writeDismissedAt();
    setDismissed(true);
  }, []);

  if (!enabled) return null;
  if (dismissed) return null;
  if (status === "unsupported") return null;
  if (status === "denied") return null;
  // Suppress only when the *browser* still says granted. We used to also
  // honor `permissionGrantedAt` from the local store, but that flag is
  // sticky — if the user later resets the site permission to "default"
  // the prompt would never re-appear. Trust the live browser state.
  if (status === "granted") return null;

  return (
    <Card
      role="region"
      aria-label="Enable local reminders"
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
          <p className="font-medium text-foreground">Enable in-browser reminders?</p>
          <p className="mt-0.5 text-muted-foreground">
            Local mode keeps notifications on this device only — no servers,
            no accounts. Granting permission lets the app nudge you when it&apos;s open.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button type="button" size="sm" onClick={onEnable} disabled={busy}>
              {busy ? "Asking..." : "Enable"}
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
