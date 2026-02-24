"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Sliders,
  Plus,
  Star,
} from "lucide-react";
import type { OnboardingState, SetupTier } from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

const tiers: {
  id: SetupTier;
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "original",
    title: "Original 75 HARD",
    description: "The classic program, exactly as designed",
    detail:
      "7 habits, all hard requirements. Miss any one and you restart from Day 1.",
    icon: <Shield className="h-6 w-6" />,
  },
  {
    id: "customized",
    title: "Customized",
    description: "Standard habits with your rules",
    detail:
      "Toggle habits on/off, set which ones are hard (reset on miss) vs soft (no penalty).",
    icon: <Sliders className="h-6 w-6" />,
  },
  {
    id: "added",
    title: "Custom + Added",
    description: "Add your own habits on top",
    detail:
      "Everything in Customized, plus create custom task or counter habits.",
    icon: <Plus className="h-6 w-6" />,
  },
];

export function OnboardingTierSelect({
  state,
  updateState,
  onNext,
  onBack,
}: Props) {
  // Recommend tier based on goals
  const hasAdvancedGoals = state.goals.some((g) =>
    ["sobriety", "consistency"].includes(g)
  );
  const recommendedTier: SetupTier = hasAdvancedGoals ? "customized" : "original";

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Choose your setup
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          How strict do you want your challenge to be?
        </p>
      </div>

      <div className="space-y-3">
        {tiers.map((tier) => {
          const selected = state.setupTier === tier.id;
          const isRecommended = tier.id === recommendedTier;
          return (
            <button
              key={tier.id}
              onClick={() => updateState({ setupTier: tier.id })}
              className={cn(
                "w-full flex items-start gap-4 p-5 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:shadow-sm",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tier.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{tier.title}</p>
                  {isRecommended && (
                    <Badge
                      variant="outline"
                      className="border-primary/40 text-primary text-[10px] whitespace-nowrap"
                    >
                      <Star className="h-2.5 w-2.5 mr-0.5" />
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {tier.description}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {tier.detail}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="gap-1">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={onNext} size="lg" className="gap-2">
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
