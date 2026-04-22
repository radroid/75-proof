"use client";

import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/lib/onboarding-types";

interface StepIndicatorProps {
  steps: readonly OnboardingStep[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div
      className="flex flex-col items-center gap-1.5"
      role="progressbar"
      aria-label={`Onboarding step ${currentIndex + 1} of ${steps.length}`}
      aria-valuenow={currentIndex + 1}
      aria-valuemin={1}
      aria-valuemax={steps.length}
    >
      <div className="flex items-center justify-center gap-1.5 sm:gap-2">
        {steps.map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className={cn(
              "h-2 rounded-full transition-all duration-300 motion-reduce:transition-none",
              i === currentIndex
                ? "w-8 bg-primary"
                : i < currentIndex
                  ? "w-2 bg-primary/60"
                  : "w-2 bg-muted"
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        Step {currentIndex + 1} of {steps.length}
      </p>
    </div>
  );
}
