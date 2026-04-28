"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { OnboardingState } from "@/lib/onboarding-types";
import { resolveSocialCategory } from "@/lib/routine-category";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_LEN = 140;

const SUGGESTIONS_BY_CATEGORY: Record<
  ReturnType<typeof resolveSocialCategory>,
  string[]
> = {
  fitness: ["a runner", "an athlete", "someone who trains daily"],
  "skill-building": [
    "a learner",
    "someone who practices daily",
    "fluent in a new language",
  ],
  productivity: [
    "a deep worker",
    "someone who ships",
    "a focused builder",
  ],
  "personal-development": [
    "a meditator",
    "a journaler",
    "someone who shows up",
  ],
};

export function OnboardingIdentity({
  state,
  updateState,
  onNext,
  onBack,
}: Props) {
  const category = resolveSocialCategory(state.templateSlug);
  const suggestions = SUGGESTIONS_BY_CATEGORY[category];
  const value = state.identityStatement;
  const remaining = MAX_LEN - value.length;

  const setStatement = (next: string) => {
    updateState({
      identityStatement: next.slice(0, MAX_LEN),
      identityTouched: true,
    });
  };

  const skip = () => {
    updateState({ identityStatement: "", identityTouched: true });
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          What are you becoming?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          One sentence. We&apos;ll show it on your dashboard so you remember
          why you started. You can change it any time.
        </p>
      </div>

      <div className="space-y-3">
        <Label htmlFor="identity-statement">
          I&apos;m becoming{value.length > 0 ? "…" : ""}
        </Label>
        <Input
          id="identity-statement"
          value={value}
          onChange={(e) => setStatement(e.target.value)}
          placeholder={`e.g. ${suggestions[0]}`}
          maxLength={MAX_LEN}
          aria-describedby="identity-counter"
          autoFocus
        />
        <p
          id="identity-counter"
          className={cn(
            "text-xs text-right tabular-nums",
            remaining < 20 ? "text-warning" : "text-muted-foreground",
          )}
        >
          {remaining} characters left
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
          Or pick a suggestion
        </p>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => {
            const selected = value === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatement(s)}
                className={cn(
                  "min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={skip}
            className="min-h-[44px] text-muted-foreground"
          >
            Skip
          </Button>
          <Button
            onClick={onNext}
            size="lg"
            className="gap-2 min-h-[48px] min-w-[140px]"
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
