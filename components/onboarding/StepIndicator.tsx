"use client";

import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/lib/onboarding-types";

interface StepIndicatorProps {
  steps: readonly OnboardingStep[];
  currentIndex: number;
}

export function StepIndicator({ steps, currentIndex }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1.5 sm:gap-2">
      {steps.map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === currentIndex
              ? "w-8 bg-primary"
              : i < currentIndex
                ? "w-2 bg-primary/60"
                : "w-2 bg-muted"
          )}
        />
      ))}
    </div>
  );
}
