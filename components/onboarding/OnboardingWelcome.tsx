"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Heart, ChevronRight } from "lucide-react";
import type { OnboardingState } from "@/lib/onboarding-types";
import { AGE_RANGES, HEALTH_CONDITIONS } from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
}

export function OnboardingWelcome({ state, updateState, onNext }: Props) {
  const [showHealthDetails, setShowHealthDetails] = useState(
    state.healthConditions.length > 0
  );

  const canProceed = state.healthAdvisoryAcknowledged;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Welcome header */}
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome to 75 Proof
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Let&apos;s set up your challenge. This takes about 2 minutes.
        </p>
      </div>

      {/* Age range */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">
          Age range <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {AGE_RANGES.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() =>
                updateState({
                  ageRange: state.ageRange === range ? null : range,
                })
              }
              aria-pressed={state.ageRange === range}
              className={cn(
                "inline-flex items-center justify-center min-h-[44px] px-4 py-2.5 rounded-lg border text-sm font-medium transition-all",
                "hover:border-primary/50 active:scale-[0.98] motion-reduce:active:scale-100",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                state.ageRange === range
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Health advisory */}
      <Card className="border-warning/30 bg-warning/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-3 flex-1">
              <div>
                <h3 className="font-semibold text-sm">Health Advisory</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  75 HARD is a demanding physical and mental challenge. Please
                  consult a healthcare professional before starting, especially
                  if you have any pre-existing conditions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowHealthDetails(!showHealthDetails)}
                aria-expanded={showHealthDetails}
                className="inline-flex min-h-[44px] items-center text-sm text-warning hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/60 focus-visible:ring-offset-2 rounded"
              >
                {showHealthDetails ? "Hide" : "I have a health condition to note"}
              </button>

              {showHealthDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground">
                    Select any that apply (optional, for your reference only):
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {HEALTH_CONDITIONS.map((condition) => {
                      const selected = state.healthConditions.includes(condition);
                      return (
                        <button
                          key={condition}
                          type="button"
                          onClick={() =>
                            updateState({
                              healthConditions: selected
                                ? state.healthConditions.filter((c) => c !== condition)
                                : [...state.healthConditions, condition],
                            })
                          }
                          aria-pressed={selected}
                          className={cn(
                            "inline-flex items-center justify-center min-h-[44px] px-3 py-2 rounded-md border text-xs transition-all",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/60 focus-visible:ring-offset-2",
                            selected
                              ? "border-warning/50 bg-warning/10 text-foreground"
                              : "border-border text-muted-foreground hover:border-warning/40"
                          )}
                        >
                          {condition}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              <div className="flex items-start gap-2 pt-1">
                <Checkbox
                  id="health-ack"
                  checked={state.healthAdvisoryAcknowledged}
                  onCheckedChange={(checked) =>
                    updateState({ healthAdvisoryAcknowledged: !!checked })
                  }
                />
                <label
                  htmlFor="health-ack"
                  className="text-sm leading-tight cursor-pointer"
                >
                  I understand this is a demanding challenge and take
                  responsibility for my health
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next button */}
      <div className="flex sm:justify-end">
        <Button
          onClick={onNext}
          disabled={!canProceed}
          size="lg"
          className="w-full sm:w-auto gap-2 min-h-[48px]"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
