"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuest } from "@/components/guest-provider";
import posthog from "posthog-js";

export function GuestSignupBanner() {
  const { promptSignup } = useGuest();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 md:left-[60px] pointer-events-none"
      role="region"
      aria-label="Guest account prompt"
    >
      {/* On mobile the banner must clear the floating pill nav + safe-area.
          On desktop there's no bottom nav, so we drop the margin. The
          --bottom-nav-gap CSS var is the single source of truth for the
          mobile nav's footprint. */}
      <div className="pointer-events-auto mx-auto max-w-xl px-4 pb-3 md:pb-4 mb-[var(--bottom-nav-gap)] md:mb-0">
        <div className="flex items-center gap-2 rounded-xl border bg-card/95 backdrop-blur-sm p-2.5 pl-3.5 shadow-lg">
          <p className="flex-1 text-sm leading-tight text-muted-foreground min-w-0">
            <span className="font-medium text-foreground">Demo mode.</span>{" "}
            <span className="hidden sm:inline">Sign up to save your progress.</span>
            <span className="sm:hidden">Save this?</span>
          </p>
          <Button
            size="sm"
            onClick={() => {
              posthog.capture("guest_signup_clicked");
              promptSignup();
            }}
            className="min-h-10 px-4 shrink-0 touch-manipulation"
          >
            Sign Up Free
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 h-11 w-11 -mr-1 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 active:bg-muted transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Dismiss guest prompt"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
