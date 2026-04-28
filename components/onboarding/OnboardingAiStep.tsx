"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnboardingPersonalizeChat } from "./OnboardingPersonalizeChat";
import type { OnboardingHabit, OnboardingState } from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  onBack: () => void;
  onApplyProposal: (proposal: {
    title: string;
    daysTotal: number;
    habits: OnboardingHabit[];
    strictMode: boolean;
  }) => void;
}

/**
 * Full-step AI coach view. Wraps the existing personalize chat and adds
 * a Back button so the user can fall back to the path picker. Applying a
 * proposal advances directly to review (handled by the parent page).
 */
export function OnboardingAiStep({ state, onBack, onApplyProposal }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center gap-2 text-primary">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs uppercase tracking-wider font-medium">
            AI Coach
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Tell me what you&apos;re after
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Share your goals, schedule, and what&apos;s worked or failed before.
          I&apos;ll propose a routine you can refine.
        </p>
      </div>

      <OnboardingPersonalizeChat
        selectedTemplateSlug={state.templateSlug}
        onClose={onBack}
        onApplyProposal={onApplyProposal}
      />

      <div className="flex items-center justify-start">
        <Button variant="ghost" onClick={onBack} className="gap-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
    </motion.div>
  );
}
