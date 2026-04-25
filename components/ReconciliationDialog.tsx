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

interface ReconciliationDialogProps {
  open: boolean;
  missedDays: number[];
  usesNewSystem: boolean;
  hasSoftHabits: boolean;
  isSubmitting: boolean;
  onReset: () => void;
  onBackfillHard: () => void;
  onBackfillAll: () => void;
}

function formatDayList(days: number[]): string {
  if (days.length === 0) return "";
  if (days.length === 1) return `Day ${days[0]}`;
  if (days.length === 2) return `Days ${days[0]} and ${days[1]}`;
  const head = days.slice(0, -1).map((d) => d.toString()).join(", ");
  return `Days ${head}, and ${days[days.length - 1]}`;
}

export function ReconciliationDialog({
  open,
  missedDays,
  usesNewSystem,
  hasSoftHabits,
  isSubmitting,
  onReset,
  onBackfillHard,
  onBackfillAll,
}: ReconciliationDialogProps) {
  const showSoftOption = usesNewSystem && hasSoftHabits;
  const dayList = formatDayList(missedDays);
  const isPlural = missedDays.length > 1;

  return (
    <Dialog open={open}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Catch up or reset?</DialogTitle>
          <DialogDescription>
            {dayList} {isPlural ? "are" : "is"} incomplete. Confirm you
            finished {isPlural ? "them" : "it"} in real life, or reset the
            challenge. If nothing happens within 7 days of a missed day, the
            challenge resets automatically.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 pb-[max(0px,env(safe-area-inset-bottom))] sm:flex-col sm:justify-stretch">
          <Button
            onClick={() => {
              posthog.capture("reconcile_backfill_hard_clicked", {
                missed_days: missedDays,
              });
              onBackfillHard();
            }}
            disabled={isSubmitting}
            size="lg"
            className="w-full active:scale-[0.98]"
          >
            I completed the HARD tasks
          </Button>
          {showSoftOption && (
            <Button
              onClick={() => {
                posthog.capture("reconcile_backfill_all_clicked", {
                  missed_days: missedDays,
                });
                onBackfillAll();
              }}
              disabled={isSubmitting}
              size="lg"
              variant="secondary"
              className="w-full active:scale-[0.98]"
            >
              I completed HARD + soft tasks
            </Button>
          )}
          <Button
            onClick={() => {
              posthog.capture("reconcile_reset_clicked", {
                missed_days: missedDays,
              });
              onReset();
            }}
            disabled={isSubmitting}
            size="lg"
            variant="outline"
            className="w-full"
          >
            Reset to Day 1
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
