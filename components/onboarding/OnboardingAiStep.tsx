"use client";

import { motion } from "framer-motion";
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
 * Full-screen AI coach. The chat owns the entire viewport — no side text,
 * no header card, no width clamp. The chat component handles its own
 * top-bar (back / reset) so it can stay sticky as the transcript grows.
 */
export function OnboardingAiStep({ state, onBack, onApplyProposal }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 flex flex-col w-full"
    >
      <OnboardingPersonalizeChat
        selectedTemplateSlug={state.templateSlug}
        onClose={onBack}
        onApplyProposal={onApplyProposal}
      />
    </motion.div>
  );
}
