"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Brain,
  Dumbbell,
  Target,
  TrendingDown,
  BookOpen,
  Droplets,
  Ban,
  CalendarCheck,
} from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding-types";
import { GOAL_OPTIONS } from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  brain: <Brain className="h-5 w-5" />,
  dumbbell: <Dumbbell className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  "trending-down": <TrendingDown className="h-5 w-5" />,
  "book-open": <BookOpen className="h-5 w-5" />,
  droplets: <Droplets className="h-5 w-5" />,
  ban: <Ban className="h-5 w-5" />,
  "calendar-check": <CalendarCheck className="h-5 w-5" />,
};

export function OnboardingGoals({ state, updateState, onNext, onBack }: Props) {
  const toggleGoal = (id: string) => {
    updateState({
      goals: state.goals.includes(id)
        ? state.goals.filter((g) => g !== id)
        : [...state.goals, id],
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          What are your goals?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select what you want to achieve. This helps us personalize your experience.
        </p>
      </div>

      {/* Goal cards grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {GOAL_OPTIONS.map((goal) => {
          const selected = state.goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              onClick={() => toggleGoal(goal.id)}
              className={cn(
                "flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl border text-left transition-all min-h-[56px]",
                "hover:border-primary/50 hover:shadow-sm",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center transition-colors",
                  selected
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {iconMap[goal.icon]}
              </div>
              <span
                className={cn(
                  "text-sm font-medium",
                  selected ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {goal.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Display name */}
      <div className="space-y-2">
        <Label htmlFor="display-name">Display name</Label>
        <Input
          id="display-name"
          value={state.displayName}
          onChange={(e) => updateState({ displayName: e.target.value })}
          placeholder="How should we call you?"
        />
        <p className="text-xs text-muted-foreground">
          Timezone: {state.timezone}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!state.displayName.trim()}
          size="lg"
          className="gap-2"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
