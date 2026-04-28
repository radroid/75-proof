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
import { formatEndDate } from "@/lib/day-utils";
import { useGuest } from "@/components/guest-provider";
import { getTemplateBySlug, isKnownTemplate } from "@/lib/routine-templates";
import { POPULAR_ROUTINES_SEED } from "@/convex/lib/popularRoutinesSeed";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onBack: () => void;
  /**
   * Jump to a specific step. The optional `returnTo` hint asks the parent
   * to bring the user back here on the next Back press — used by AI-path
   * edits so the chat's Back button round-trips to review instead of
   * stepping back through the normal flow to `welcome`.
   */
  onGoToStep: (step: OnboardingStep, options?: { returnTo?: OnboardingStep }) => void;
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
  const { isGuest } = useGuest();
  const activeHabits = state.habits.filter((h) => h.isActive);
  const hardCount = activeHabits.filter((h) => h.isHard).length;
  const themeName = themeMetadata[state.theme]?.name ?? state.theme;
  const isCatalogTemplate = isKnownTemplate(state.templateSlug);
  const templateLabel = resolveTemplateLabel(state.templateSlug, isCatalogTemplate);
  // The AI path skips goals/theme/duration/habits as standalone steps —
  // everything funnels through the coach chat. Edit buttons on this page
  // point back at the chat instead of dead-ending on a step the parent
  // marked as `disabled`. Theme is hidden entirely (the user can change
  // it later in settings) so we don't suggest a control they can't reach.
  const isAiPath = state.entryPath === "ai";

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
        {/* Profile — AI path collects display name from the user record
            (Clerk-populated, signed-in only), so the Edit button has
            nowhere useful to point. Hide it for AI users. */}
        <SummaryRow
          label="Name"
          value={state.displayName}
          onEdit={isAiPath ? undefined : () => onGoToStep("goals")}
        />

        {/* Theme — AI path doesn't expose the theme step; hide entirely so
            we don't promise an edit affordance the flow won't honor. */}
        {!isAiPath && (
          <SummaryRow
            label="Theme"
            value={themeName}
            onEdit={() => onGoToStep("theme")}
          />
        )}

        {/* Routine template */}
        <SummaryRow
          label="Routine"
          value={templateLabel}
          onEdit={() => {
            if (state.entryPath === "custom") {
              // Custom path skips the template step entirely (the
              // build-your-own seeds are set at the path picker), so
              // route to habits — that's where a custom user actually
              // shapes their routine.
              onGoToStep("habits");
              return;
            }
            // AI users round-trip back to review on chat Back; popular
            // users follow the normal back-stack.
            onGoToStep("template", isAiPath ? { returnTo: "review" } : undefined);
          }}
        />

        {/* Challenge length + computed end date */}
        <SummaryRow
          label="Challenge length"
          value={`${state.daysTotal} days · ends ${formatEndDate(state.startDate, state.daysTotal)}`}
          onEdit={() => {
            // AI path: duration was set by the coach proposal — sending the
            // user back to the chat lets them ask for a different length,
            // and the returnTo hint snaps them back to review on Back.
            if (isAiPath) {
              onGoToStep("template", { returnTo: "review" });
              return;
            }
            const lockedDuration =
              isCatalogTemplate &&
              getTemplateBySlug(state.templateSlug).lockedDuration;
            onGoToStep(lockedDuration ? "template" : "duration");
          }}
        />

        {/* Habits */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-sm font-medium">
                Habits ({activeHabits.length} active, {hardCount} hard)
              </p>
              <button
                type="button"
                // AI users edit habits by talking to the coach; everyone
                // else goes to the dedicated habits step. The returnTo
                // hint makes the chat's Back button snap back to review.
                onClick={() =>
                  isAiPath
                    ? onGoToStep("template", { returnTo: "review" })
                    : onGoToStep("habits")
                }
                aria-label="Edit habits"
                className="inline-flex min-h-[44px] items-center gap-1 rounded px-2 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
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

      {/* Visibility — hidden in local mode. There's no account, no friend
          graph, and nothing leaves the device, so "who can see this" is a
          meaningless question. The submit handler forces "private" for
          guests so the persisted shape stays valid. */}
      {!isGuest && (
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
              <Label
                key={option.value}
                htmlFor={`vis-${option.value}`}
                className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-transparent px-2 py-1 hover:border-border active:bg-muted/40"
              >
                <RadioGroupItem value={option.value} id={`vis-${option.value}`} />
                <span className="flex-1">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    {option.desc}
                  </span>
                </span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <Button variant="ghost" onClick={onBack} className="gap-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={isSubmitting}
          size="lg"
          variant="default"
          className="flex-1 sm:flex-initial gap-2 sm:min-w-[180px] min-h-[48px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
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
  /** Omit when the field has no editable surface in the current flow (e.g.
   *  display name on the AI path is sourced from the user record). */
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 py-3 px-4 rounded-lg border">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label}`}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded px-2 text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      )}
    </div>
  );
}

function resolveTemplateLabel(slug: string, isCatalog: boolean): string {
  if (isCatalog) return getTemplateBySlug(slug).title;
  if (slug.startsWith("ai-generated:")) return "AI-generated routine";
  if (slug.startsWith("popular:")) {
    const popularSlug = slug.slice("popular:".length);
    const found = POPULAR_ROUTINES_SEED.find((r) => r.slug === popularSlug);
    return found?.title ?? "Popular routine";
  }
  return "Custom routine";
}
