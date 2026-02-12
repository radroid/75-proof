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

interface ChallengeFailedDialogProps {
  open: boolean;
  failedOnDay: number;
  onStartNew: () => void;
  onDismiss: () => void;
}

export function ChallengeFailedDialog({
  open,
  failedOnDay,
  onStartNew,
  onDismiss,
}: ChallengeFailedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Challenge Reset</DialogTitle>
          <DialogDescription>
            Day {failedOnDay} was incomplete and your 2-day grace period has
            ended. Per the 75 HARD rules, the challenge resets to Day 0.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Don&apos;t give up — every restart is another step forward. You&apos;ve
          got this.
        </p>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button onClick={onStartNew} className="flex-1">
            Start New Challenge
          </Button>
          <Button variant="outline" onClick={onDismiss} className="flex-1">
            Dismiss
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
