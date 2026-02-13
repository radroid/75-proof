"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGuest } from "@/components/guest-provider";

export function GuestSignupBanner() {
  const { promptSignup } = useGuest();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:left-[60px] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-xl px-4 pb-4 md:pb-4 mb-[calc(56px+2rem+env(safe-area-inset-bottom,0px))] md:mb-0">
        <div className="flex items-center gap-3 rounded-lg border bg-card/95 backdrop-blur-sm p-3 shadow-lg">
          <p className="flex-1 text-sm text-muted-foreground">
            You&apos;re browsing as a guest.{" "}
            <span className="hidden sm:inline">Sign up to save your progress.</span>
          </p>
          <Button size="sm" onClick={promptSignup}>
            Sign Up Free
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
