"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  Pencil,
  Rocket,
  Check,
  Loader2,
} from "lucide-react";
import { themeMetadata } from "@/lib/themes";
import type { OnboardingState, OnboardingStep } from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onBack: () => void;
  onGoToStep: (step: OnboardingStep) => void;
  onComplete: () => void;
  isSubmitting: boolean;
}

export function OnboardingReview({
  state,
  updateState,
  onBack,
  onGoToStep,
  onComplete,
  isSubmitting,
}: Props) {
  const activeHabits = state.habits.filter((h) => h.isActive);
  const hardCount = activeHabits.filter((h) => h.isHard).length;
  const themeName = themeMetadata[state.theme]?.name ?? state.theme;

  const tierLabels: Record<string, string> = {
    original: "Original 75 HARD",
    customized: "Customized",
    added: "Custom + Added",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Ready to start?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Review your setup and launch your challenge.
        </p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        {/* Profile */}
        <SummaryRow
          label="Name"
          value={state.displayName}
          onEdit={() => onGoToStep("goals")}
        />

        {/* Theme */}
        <SummaryRow
          label="Theme"
          value={themeName}
          onEdit={() => onGoToStep("theme")}
        />

        {/* Tier */}
        <SummaryRow
          label="Setup"
          value={tierLabels[state.setupTier] ?? state.setupTier}
          onEdit={() => onGoToStep("tier")}
        />

        {/* Habits */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">
                Habits ({activeHabits.length} active, {hardCount} hard)
              </p>
              <button
                onClick={() => onGoToStep("habits")}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </button>
            </div>
            <div className="space-y-1.5">
              {activeHabits.map((h, i) => (
                <div key={i} className="flex items-center gap-2 text-sm min-h-[32px]">
                  <Check className="h-3 w-3 text-success shrink-0" />
                  <span className="flex-1 min-w-0 truncate">{h.name}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[9px] h-4 px-1",
                      h.isHard
                        ? "border-destructive/40 text-destructive"
                        : "border-muted-foreground/30 text-muted-foreground"
                    )}
                  >
                    {h.isHard ? "Hard" : "Soft"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Start date */}
      <div className="space-y-2">
        <Label htmlFor="start-date">Start date</Label>
        <Input
          id="start-date"
          type="date"
          value={state.startDate}
          onChange={(e) => updateState({ startDate: e.target.value })}
        />
      </div>

      {/* Visibility */}
      <div className="space-y-2">
        <Label>Who can see your progress?</Label>
        <RadioGroup
          value={state.visibility}
          onValueChange={(v) =>
            updateState({ visibility: v as OnboardingState["visibility"] })
          }
          className="space-y-2"
        >
          {[
            { value: "private", label: "Private", desc: "Only you" },
            {
              value: "friends",
              label: "Friends",
              desc: "Your friends can see",
            },
            { value: "public", label: "Public", desc: "Anyone can see" },
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={`vis-${option.value}`} />
              <Label
                htmlFor={`vis-${option.value}`}
                className="flex-1 cursor-pointer"
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {option.desc}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={isSubmitting}
          size="lg"
          variant="default"
          className="gap-2 min-w-[180px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Starting...
            </>
          ) : (
            <>
              <Rocket className="h-4 w-4" />
              Start Challenge
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}

function SummaryRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-primary hover:underline flex items-center gap-1"
      >
        <Pencil className="h-3 w-3" />
        Edit
      </button>
    </div>
  );
}
