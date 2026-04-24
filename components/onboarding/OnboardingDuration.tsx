"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays, Sparkles } from "lucide-react";
import {
  DURATION_PRESETS,
  DURATION_MIN,
  DURATION_MAX,
  type OnboardingState,
} from "@/lib/onboarding-types";
import { formatEndDate } from "@/lib/day-utils";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OnboardingDuration({
  state,
  updateState,
  onNext,
  onBack,
}: Props) {
  const isPreset = (DURATION_PRESETS as readonly number[]).includes(
    state.daysTotal
  );
  const [showCustom, setShowCustom] = useState(!isPreset);
  const [customValue, setCustomValue] = useState<string>(
    isPreset ? "" : String(state.daysTotal)
  );

  const isValid =
    Number.isFinite(state.daysTotal) &&
    state.daysTotal >= DURATION_MIN &&
    state.daysTotal <= DURATION_MAX;

  const previewStart = state.startDate || new Date().toISOString().split("T")[0];
  const endDateLabel = isValid
    ? formatEndDate(previewStart, state.daysTotal)
    : null;

  const handlePreset = (days: number) => {
    setShowCustom(false);
    setCustomValue("");
    updateState({ daysTotal: days });
  };

  const handleCustomToggle = () => {
    setShowCustom(true);
    if (!customValue) setCustomValue(String(state.daysTotal));
  };

  const handleCustomChange = (raw: string) => {
    setCustomValue(raw);
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed)) {
      updateState({ daysTotal: parsed });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          How many days?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Pick a length you can commit to. You can extend it later — but you
          can&apos;t shorten it.
        </p>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DURATION_PRESETS.map((days) => {
          const selected = !showCustom && state.daysTotal === days;
          return (
            <button
              key={days}
              type="button"
              onClick={() => handlePreset(days)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl border-2 p-4 transition-all min-h-[88px]",
                "hover:border-primary/50 hover:shadow-sm active:scale-[0.99] motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border"
              )}
            >
              <span className="text-2xl font-bold tabular-nums">{days}</span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                days
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom toggle / input */}
      <div className="space-y-3">
        {!showCustom ? (
          <button
            type="button"
            onClick={handleCustomToggle}
            className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors min-h-[56px]"
          >
            <Sparkles className="h-4 w-4" />
            Pick a custom length
          </button>
        ) : (
          <div className="space-y-2 rounded-xl border-2 border-primary bg-primary/5 p-4">
            <Label htmlFor="custom-days">Custom length</Label>
            <div className="flex items-center gap-3">
              <Input
                id="custom-days"
                type="number"
                inputMode="numeric"
                min={DURATION_MIN}
                max={DURATION_MAX}
                value={customValue}
                onChange={(e) => handleCustomChange(e.target.value)}
                placeholder="e.g. 100"
                className="h-11 text-base"
              />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                days
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Between {DURATION_MIN} and {DURATION_MAX} days.
            </p>
          </div>
        )}
      </div>

      {/* End-date preview */}
      <div className="rounded-xl border bg-muted/40 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0">
          <CalendarDays className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Ends on
          </p>
          <p className="text-sm font-semibold truncate">
            {endDateLabel ?? "—"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!isValid}
          size="lg"
          className="flex-1 sm:flex-initial gap-2 min-h-[48px]"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
