"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Share } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useInstallPrompt } from "./use-install-prompt";

// Slight delay before surfacing the prompt so it doesn't slam the user on
// the very first paint of the dashboard.
const INITIAL_DELAY_MS = 2500;

export function InstallPrompt() {
  const { canInstall, isIOS, promptInstall, dismiss } = useInstallPrompt();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!canInstall) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setOpen(true), INITIAL_DELAY_MS);
    return () => clearTimeout(t);
  }, [canInstall]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Closing via overlay/esc/X counts as "not now" — respect the 7 day window.
    if (!next) dismiss();
  };

  const handleInstall = async () => {
    await promptInstall();
    setOpen(false);
  };

  const handleNotNow = () => {
    dismiss();
    setOpen(false);
  };

  if (!canInstall) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: "#FF6154" }}
              aria-hidden="true"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={22}
                height={22}
                className="shrink-0"
              />
            </div>
            <DialogTitle>
              {isIOS ? "Add to Home Screen" : "Install 75 Proof"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2" asChild>
            {isIOS ? (
              <ol className="mt-1 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
                  >
                    1
                  </span>
                  <span className="min-w-0">
                    Tap the share icon
                    <span
                      className="mx-1 inline-flex h-5 w-5 items-center justify-center rounded-md bg-muted align-[-5px]"
                      aria-label="share icon"
                    >
                      <Share
                        className="h-3.5 w-3.5"
                        style={{ color: "#FF6154" }}
                        aria-hidden="true"
                      />
                    </span>
                    in Safari&rsquo;s toolbar.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
                  >
                    2
                  </span>
                  <span>Choose &ldquo;Add to Home Screen.&rdquo;</span>
                </li>
                <li className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground"
                  >
                    3
                  </span>
                  <span>Tap &ldquo;Add&rdquo; in the top right.</span>
                </li>
              </ol>
            ) : (
              <span>
                Add 75 Proof to your home screen for quick access and a fullscreen experience.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          {isIOS ? (
            <Button onClick={handleNotNow} className="w-full sm:w-auto">
              Got it
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleNotNow}
                className="w-full sm:w-auto"
              >
                Not now
              </Button>
              <Button
                type="button"
                onClick={handleInstall}
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                Install
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
