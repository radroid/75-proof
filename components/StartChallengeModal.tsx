"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Check } from "lucide-react";
import { toast } from "sonner";
import posthog from "posthog-js";
import {
  DEFAULT_TEMPLATE_SLUG,
  getTemplateBySlug,
} from "@/lib/routine-templates";

interface StartChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Routine catalog slug to label this dialog with. Defaults to 75 HARD. */
  templateSlug?: string;
}

export function StartChallengeModal({
  open,
  onOpenChange,
  templateSlug = DEFAULT_TEMPLATE_SLUG,
}: StartChallengeModalProps) {
  const template = getTemplateBySlug(templateSlug);
  const user = useQuery(api.users.getCurrentUser);
  const startChallenge = useMutation(api.challenges.startChallenge);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [visibility, setVisibility] = useState<"private" | "friends" | "public">(
    "friends"
  );
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    if (!user) return;

    setIsStarting(true);

    try {
      await startChallenge({
        userId: user._id,
        startDate,
        visibility,
      });
      posthog.capture("challenge_started", {
        start_date: startDate,
        visibility,
      });
      toast.success("Challenge started! Let's go!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start challenge");
    } finally {
      setIsStarting(false);
    }
  };

  const visibilityOptions = [
    { value: "private" as const, label: "Private", desc: "Only you" },
    { value: "friends" as const, label: "Friends", desc: "Your friends can see" },
    { value: "public" as const, label: "Public", desc: "Anyone can see" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Start <span className="text-emerald-500">{template.title}</span>
          </DialogTitle>
          <DialogDescription>
            Ready to commit to {template.daysTotal} days?
          </DialogDescription>
        </DialogHeader>

        {/* Rules reminder */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <h3 className="font-medium">Daily Requirements:</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Two 45-minute workouts (one must be outdoor)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Follow a diet (no cheat meals)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>No alcohol</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Drink 1 gallon (128 oz) of water</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Read 10 pages of non-fiction</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                <span>Take a progress photo</span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Miss any requirement? Start over from Day 1.
            </p>
          </CardContent>
        </Card>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="start-date" className="text-sm font-medium">
              Start Date
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-11 text-base md:h-10 md:text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Who can see your progress?</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(value) => setVisibility(value as typeof visibility)}
              className="gap-2"
            >
              {visibilityOptions.map((option) => {
                const selected = visibility === option.value;
                return (
                  <Label
                    key={option.value}
                    htmlFor={option.value}
                    className={`flex min-h-[48px] cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 transition-colors active:bg-muted ${
                      selected
                        ? "border-emerald-500 bg-emerald-500/5"
                        : "border-input hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={option.value}
                      id={option.value}
                      className="size-5"
                    />
                    <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {option.desc}
                      </span>
                    </span>
                  </Label>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col-reverse gap-2 border-t bg-background/95 px-6 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            size="lg"
            className="w-full sm:flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting || !user}
            loading={isStarting}
            size="lg"
            className="w-full bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 active:bg-emerald-700 sm:flex-1"
          >
            {isStarting ? "Starting..." : "Start Challenge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
