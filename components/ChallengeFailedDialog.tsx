"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import posthog from "posthog-js";

interface ChallengeFailedDialogProps {
  open: boolean;
  failedOnDay: number;
  streakReached?: number;
  attemptNumber?: number;
  onStartNew: () => void;
  onDismiss: () => void;
}

export function ChallengeFailedDialog({
  open,
  failedOnDay,
  streakReached,
  attemptNumber,
  onStartNew,
  onDismiss,
}: ChallengeFailedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>A fresh start</DialogTitle>
          <DialogDescription>
            Day {failedOnDay} sat incomplete for more than 7 days, so per 75
            HARD rules the counter goes back to Day 0. That&apos;s it — no
            penalty, just a reset.
          </DialogDescription>
        </DialogHeader>
        {streakReached !== undefined && streakReached > 0 && (
          <div
            className="flex items-stretch rounded-lg border p-3 text-sm"
            aria-label="Previous attempt summary"
          >
            <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
              <p className="text-2xl font-bold tabular-nums">{streakReached}</p>
              <p className="text-xs text-muted-foreground">
                {streakReached === 1 ? "day reached" : "days reached"}
              </p>
            </div>
            {attemptNumber !== undefined && (
              <>
                <div className="mx-2 w-px self-stretch bg-border" aria-hidden />
                <div className="flex flex-1 flex-col items-center justify-center gap-0.5">
                  <p className="text-2xl font-bold tabular-nums">
                    #{attemptNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">next attempt</p>
                </div>
              </>
            )}
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          Every restart is data, not failure. You made it
          {streakReached ? ` ${streakReached} day${streakReached === 1 ? "" : "s"}` : " this far"}
          {" "}— you can do it again, stronger.
        </p>
        <DialogFooter className="flex-col-reverse gap-2 pb-[max(0px,env(safe-area-inset-bottom))] sm:flex-row">
          <Button
            variant="outline"
            onClick={onDismiss}
            size="lg"
            className="w-full sm:flex-1"
          >
            Not now
          </Button>
          <Button
            onClick={() => {
              posthog.capture("challenge_failed_restart_clicked", {
                failed_on_day: failedOnDay,
                streak_reached: streakReached,
                attempt_number: attemptNumber,
              });
              onStartNew();
            }}
            size="lg"
            className="w-full active:scale-[0.98] sm:flex-1"
          >
            Start New Challenge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
