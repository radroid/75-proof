"use client";

import { useEffect, useState } from "react";
import { Vibrate } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  haptic,
  hasBeenPromptedForHaptics,
  isIOSDevice,
  markHapticsPrompted,
  setHapticsEnabled,
} from "@/lib/haptics";
import posthog from "posthog-js";

// Stagger past the install-prompt's 2500ms so the two dialogs never compete
// for the same frame. If the install prompt is up, this one will sit behind
// it and show on next mount after the user dismisses install.
const INITIAL_DELAY_MS = 4500;

/**
 * One-time iOS haptics opt-in. iOS doesn't have a JS-callable permission
 * API for haptics — the "permission" here is an in-app onboarding choice
 * that (a) records the user's preference and (b) plays a sample buzz from
 * the trusted-event window of the Enable button so the user feels what
 * they'll get. Android browsers use `navigator.vibrate` without a prompt,
 * so we skip this dialog there entirely.
 */
export function HapticsPermissionPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isIOSDevice()) return;
    if (hasBeenPromptedForHaptics()) return;

    const t = window.setTimeout(() => setOpen(true), INITIAL_DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const handleEnable = () => {
    // Fire from inside the click handler so iOS treats the UISwitch trick
    // inside `haptic()` as a trusted gesture — same window the Enable
    // button click opened. `success` is the firmest of our patterns and
    // doubles as confirmation that haptics work on this device.
    setHapticsEnabled(true);
    haptic("success");
    markHapticsPrompted();
    posthog.capture("haptics_prompt_accepted");
    setOpen(false);
  };

  const handleDecline = () => {
    setHapticsEnabled(false);
    markHapticsPrompted();
    posthog.capture("haptics_prompt_declined");
    setOpen(false);
  };

  // Closing via overlay/esc/X: treat as "not now" — the user can still
  // re-enable from Settings → Haptics, and we mark prompted so we don't
  // re-ask on every dashboard load.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      markHapticsPrompted();
      posthog.capture("haptics_prompt_dismissed");
    }
    setOpen(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10"
              aria-hidden="true"
            >
              <Vibrate className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Enable haptics?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            75 Proof can buzz when you check off habits, hit streaks, and tap
            through the app. You can change this any time in Settings.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDecline}
            className="w-full sm:w-auto"
          >
            No thanks
          </Button>
          <Button
            type="button"
            onClick={handleEnable}
            className="w-full sm:w-auto"
          >
            <Vibrate className="h-4 w-4" aria-hidden="true" />
            Enable haptics
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
