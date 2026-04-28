"use client";

import { cn } from "@/lib/utils";
import type { OnboardingStep } from "@/lib/onboarding-types";

interface StepIndicatorProps {
  steps: readonly OnboardingStep[];
  currentIndex: number;
  /**
   * Highest step index the user has reached. Dots at or below this index
   * become clickable shortcuts; later dots stay static so we don't land
   * on a screen whose required input hasn't been collected yet.
   */
  maxReachedIndex?: number;
  /**
   * Indices the current flow skips (e.g. `template` on the custom path,
   * `duration` when the chosen template has a locked duration). Their
   * dots render dimmed and inert so the navigator never advertises a
   * shortcut the forward flow wouldn't take.
   */
  disabledIndices?: ReadonlySet<number>;
  onStepClick?: (index: number) => void;
}

const STEP_LABELS: Record<OnboardingStep, string> = {
  path: "Path",
  welcome: "Welcome",
  goals: "Goals",
  theme: "Theme",
  template: "Routine",
  duration: "Duration",
  habits: "Habits",
  identity: "Identity",
  review: "Review",
};

export function StepIndicator({
  steps,
  currentIndex,
  maxReachedIndex,
  disabledIndices,
  onStepClick,
}: StepIndicatorProps) {
  const ceiling = maxReachedIndex ?? currentIndex;
  return (
    // Now that the dots are real buttons, a `progressbar` wrapper would
    // hide the children from assistive tech. Use a plain navigation
    // landmark and let each dot carry its own `aria-current`/label, then
    // surface the numeric "Step X of Y" line as a separate live status
    // outside the nav so it still gets announced when the step changes.
    <div className="flex flex-col items-center gap-1.5">
      <nav
        aria-label="Onboarding steps"
        className="flex items-center justify-center gap-1.5 sm:gap-2"
      >
        {steps.map((step, i) => {
          const isCurrent = i === currentIndex;
          const isDisabled = disabledIndices?.has(i) ?? false;
          // "Visited" derives from the reach ceiling, not the current
          // index — after a back-jump, steps in (currentIndex, ceiling]
          // are still revisitable, so they should look filled-in like
          // the steps already behind us, not muted like never-reached
          // future steps.
          const isVisited = !isCurrent && i <= ceiling && !isDisabled;
          const isReachable =
            onStepClick != null && i <= ceiling && !isDisabled;
          const dot = (
            <span
              aria-hidden="true"
              className={cn(
                "block h-2 rounded-full transition-all duration-300 motion-reduce:transition-none",
                isCurrent
                  ? "w-8 bg-primary"
                  : isDisabled
                    ? "w-2 bg-muted/50"
                    : isVisited
                      ? "w-2 bg-primary/60"
                      : "w-2 bg-muted",
              )}
            />
          );
          if (!isReachable) {
            return (
              <div key={i} aria-hidden="true">
                {dot}
              </div>
            );
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => onStepClick?.(i)}
              aria-label={`Go to step ${i + 1}: ${STEP_LABELS[step]}`}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "inline-flex h-6 items-center justify-center rounded-full px-1",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "hover:scale-110 active:scale-95 motion-reduce:transform-none",
                "transition-transform",
              )}
            >
              {dot}
            </button>
          );
        })}
      </nav>
      <p
        className="text-xs text-muted-foreground tabular-nums"
        role="status"
        aria-live="polite"
      >
        Step {currentIndex + 1} of {steps.length} · {STEP_LABELS[steps[currentIndex]]}
      </p>
    </div>
  );
}
