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

interface StartChallengeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StartChallengeModal({ open, onOpenChange }: StartChallengeModalProps) {
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
      toast.success("Challenge started! Let's go!");
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to start challenge");
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Start <span className="text-emerald-500">75 HARD</span>
          </DialogTitle>
          <DialogDescription>
            Are you ready to commit to 75 days of mental toughness?
          </DialogDescription>
        </DialogHeader>

        {/* Rules reminder */}
        <Card className="bg-muted/50">
          <CardContent className="pt-4">
            <h3 className="font-medium">Daily Requirements:</h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Two 45-minute workouts (one must be outdoor)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Follow a diet (no cheat meals)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                No alcohol
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Drink 1 gallon (128 oz) of water
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Read 10 pages of non-fiction
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-500" />
                Take a progress photo
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
            <Label htmlFor="start-date">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Who can see your progress?</Label>
            <RadioGroup
              value={visibility}
              onValueChange={(value) => setVisibility(value as typeof visibility)}
              className="space-y-2"
            >
              {[
                { value: "private", label: "Private", desc: "Only you" },
                { value: "friends", label: "Friends", desc: "Your friends can see" },
                { value: "public", label: "Public", desc: "Anyone can see" },
              ].map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-1 cursor-pointer">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {option.desc}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleStart}
            disabled={isStarting || !user}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600"
          >
            {isStarting ? "Starting..." : "Start Challenge"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
