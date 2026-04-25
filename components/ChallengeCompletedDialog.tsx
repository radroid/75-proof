"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import posthog from "posthog-js";
import { Trophy, Infinity as InfinityIcon, RefreshCcw } from "lucide-react";

interface ChallengeCompletedDialogProps {
  open: boolean;
  challengeId: Id<"challenges">;
  daysTotal: number;
  onDismiss: () => void;
}

export function ChallengeCompletedDialog({
  open,
  challengeId,
  daysTotal,
  onDismiss,
}: ChallengeCompletedDialogProps) {
  const router = useRouter();
  const convertToHabitTracker = useMutation(api.challenges.convertToHabitTracker);
  const startNewChallengeAfterCompletion = useMutation(
    api.challenges.startNewChallengeAfterCompletion
  );
  const [busy, setBusy] = useState(false);

  const handleHabitTracker = async () => {
    setBusy(true);
    try {
      await convertToHabitTracker({ challengeId });
      posthog.capture("challenge_completed_continued_as_tracker", {
        days_total: daysTotal,
      });
      toast.success("Continuing as a habit tracker — no end date");
      onDismiss();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't switch modes"
      );
    } finally {
      setBusy(false);
    }
  };

  const handleNewChallenge = async () => {
    setBusy(true);
    try {
      // Preserve the "completed" status (the user did finish) and just clear
      // the onboarding gate so the page lets them re-enter the flow.
      await startNewChallengeAfterCompletion({ challengeId });
      posthog.capture("challenge_completed_started_new", {
        days_total: daysTotal,
      });
      onDismiss();
      router.push("/onboarding");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Couldn't start new challenge"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
            <Trophy className="h-7 w-7 text-success" />
          </div>
          <DialogTitle className="text-center text-2xl">
            You did it.
          </DialogTitle>
          <DialogDescription className="text-center">
            {daysTotal === 75
              ? "You finished the 75 HARD challenge — every habit, every day."
              : `You finished your ${daysTotal}-day challenge — every habit, every day.`}{" "}
            What&apos;s next?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <button
            type="button"
            onClick={handleHabitTracker}
            disabled={busy}
            className="w-full text-left rounded-lg border-2 border-primary/30 bg-primary/5 p-4 transition-colors hover:border-primary/60 disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary shrink-0">
                <InfinityIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Continue as a habit tracker</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Keep the streak alive with no end date. Same habits, no
                  finish line.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={handleNewChallenge}
            disabled={busy}
            className="w-full text-left rounded-lg border bg-background p-4 transition-colors hover:bg-muted/50 disabled:opacity-50"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
                <RefreshCcw className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Start a new challenge</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Walk through onboarding and pick fresh habits and a length.
                </p>
              </div>
            </div>
          </button>
        </div>

        <DialogFooter className="pb-[max(0px,env(safe-area-inset-bottom))]">
          <Button
            variant="ghost"
            onClick={onDismiss}
            disabled={busy}
            size="lg"
            className="w-full sm:w-auto"
          >
            Just celebrate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
