"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  Flower2,
  Star,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  DEFAULT_TEMPLATE_SLUG,
  ROUTINE_TEMPLATES,
  getTemplateBySlug,
  type RoutineTemplate,
} from "@/lib/routine-templates";
import type { OnboardingState } from "@/lib/onboarding-types";
import { useGuest } from "@/components/guest-provider";
import { OnboardingPersonalizeChat } from "./OnboardingPersonalizeChat";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
  onApplyAiProposal: (proposal: {
    title: string;
    daysTotal: number;
    habits: OnboardingState["habits"];
    strictMode: boolean;
  }) => void;
}

const ICONS: Record<string, React.ReactNode> = {
  shield: <Shield className="h-6 w-6" />,
  "flower-2": <Flower2 className="h-6 w-6" />,
};

function iconFor(template: RoutineTemplate): React.ReactNode {
  return ICONS[template.heroIcon] ?? <Shield className="h-6 w-6" />;
}

export function OnboardingTemplateSelect({
  state,
  updateState,
  onNext,
  onBack,
  onApplyAiProposal,
}: Props) {
  const { isGuest } = useGuest();
  const [chatOpen, setChatOpen] = useState(false);
  const llmEnabled = process.env.NEXT_PUBLIC_LLM_PERSONALIZE === "1";

  const recommendedSlug = pickRecommendedSlug(state.goals);

  const handlePick = (template: RoutineTemplate) => {
    // Seed habits in the same state transition as the template change so
    // we never render an empty habit list and don't rely on a follow-up
    // effect to re-populate (avoids a render-triggered setState cycle).
    updateState({
      templateSlug: template.slug,
      habits: template.habits.map((h) => ({ ...h, isActive: true })),
      daysTotal: template.daysTotal,
      setupTier: template.strictMode ? "original" : "added",
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
          Pick your routine
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Browse curated programs. You can tweak the habits in the next step.
        </p>
      </div>

      <div className="space-y-3">
        {ROUTINE_TEMPLATES.map((template) => {
          const selected = state.templateSlug === template.slug;
          const isRecommended = template.slug === recommendedSlug;
          return (
            <button
              key={template.slug}
              type="button"
              onClick={() => handlePick(template)}
              aria-pressed={selected}
              className={cn(
                "w-full flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 text-left transition-all",
                "hover:border-primary/50 hover:shadow-sm active:scale-[0.99] motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
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
                {iconFor(template)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{template.title}</p>
                  {isRecommended && (
                    <Badge
                      variant="outline"
                      className="border-primary/40 text-primary text-[10px] whitespace-nowrap"
                    >
                      <Star className="h-2.5 w-2.5 mr-0.5" />
                      Recommended
                    </Badge>
                  )}
                  {template.strictMode && (
                    <Badge
                      variant="outline"
                      className="border-destructive/40 text-destructive text-[10px] whitespace-nowrap"
                    >
                      <Lock className="h-2.5 w-2.5 mr-0.5" />
                      Strict
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {template.summary}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {template.daysTotal} days · {template.difficulty} ·{" "}
                  {template.habits.length} habits
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {llmEnabled && !isGuest && !chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors min-h-[56px]"
        >
          <Sparkles className="h-4 w-4" />
          Want help picking? Build with AI
        </button>
      )}

      {llmEnabled && !isGuest && chatOpen && (
        <OnboardingPersonalizeChat
          selectedTemplateSlug={state.templateSlug}
          onClose={() => setChatOpen(false)}
          onApplyProposal={onApplyAiProposal}
        />
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
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

function pickRecommendedSlug(goals: string[]): string {
  // Same gentle heuristic as the old tier select: users with softer goals
  // get nudged toward the lighter program, everyone else stays on 75 HARD.
  const softer = goals.some((g) => ["consistency", "sobriety"].includes(g));
  if (softer) {
    const yoga = getTemplateBySlug("30-day-yoga");
    return yoga.slug;
  }
  return DEFAULT_TEMPLATE_SLUG;
}
