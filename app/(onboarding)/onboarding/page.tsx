"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThemePersonality } from "@/components/theme-provider";
import { setStoredPersonality } from "@/lib/themes";
import { STANDARD_HABITS } from "@/convex/lib/standardHabits";
import {
  type OnboardingState,
  type OnboardingStep,
  INITIAL_ONBOARDING_STATE,
  ONBOARDING_STEPS,
} from "@/lib/onboarding-types";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingGoals } from "@/components/onboarding/OnboardingGoals";
import { OnboardingTheme } from "@/components/onboarding/OnboardingTheme";
import { OnboardingTierSelect } from "@/components/onboarding/OnboardingTierSelect";
import { OnboardingHabitConfig } from "@/components/onboarding/OnboardingHabitConfig";
import { OnboardingReview } from "@/components/onboarding/OnboardingReview";
import { HeroSkeleton } from "@/components/ui/skeleton-enhanced";

const STORAGE_KEY = "75hard-onboarding-state";
const STEP_KEY = "75hard-onboarding-step";

function loadState(): OnboardingState {
  if (typeof window === "undefined") return INITIAL_ONBOARDING_STATE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return { ...INITIAL_ONBOARDING_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return INITIAL_ONBOARDING_STATE;
}

function loadStep(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = sessionStorage.getItem(STEP_KEY);
    if (raw) return Math.min(Number(raw), ONBOARDING_STEPS.length - 1);
  } catch { /* ignore */ }
  return 0;
}

export default function OnboardingPage() {
  const router = useRouter();
  const user = useQuery(api.users.getCurrentUser);
  const completeOnboarding = useMutation(api.onboarding.completeOnboarding);
  const { setPersonality } = useThemePersonality();

  const [state, setState] = useState<OnboardingState>(loadState);
  const [stepIndex, setStepIndex] = useState(loadStep);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate displayName from user when available
  useEffect(() => {
    if (user && !state.displayName) {
      setState((s) => ({ ...s, displayName: user.displayName }));
    }
  }, [user, state.displayName]);

  // Populate default habits when no habits set
  useEffect(() => {
    if (state.habits.length === 0) {
      setState((s) => ({
        ...s,
        habits: STANDARD_HABITS.map((h) => ({
          ...h,
          isActive: true,
        })),
      }));
    }
  }, [state.habits.length]);

  // Restore chosen theme on page load (e.g. after refresh mid-onboarding)
  useEffect(() => {
    if (state.theme) {
      setPersonality(state.theme);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    sessionStorage.setItem(STEP_KEY, String(stepIndex));
  }, [stepIndex]);

  // Redirect away if user already completed onboarding
  useEffect(() => {
    if (user?.onboardingComplete) {
      router.replace("/dashboard");
    }
  }, [user?.onboardingComplete, router]);

  const updateState = useCallback((partial: Partial<OnboardingState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  const next = useCallback(() => {
    setStepIndex((i) => Math.min(i + 1, ONBOARDING_STEPS.length - 1));
  }, []);

  const back = useCallback(() => {
    setStepIndex((i) => Math.max(i - 1, 0));
  }, []);

  const goToStep = useCallback((step: OnboardingStep) => {
    const idx = ONBOARDING_STEPS.indexOf(step);
    if (idx >= 0) setStepIndex(idx);
  }, []);

  const handleComplete = useCallback(async () => {
    if (!user || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Apply theme
      setPersonality(state.theme);
      setStoredPersonality(state.theme);

      // Submit to backend
      await completeOnboarding({
        displayName: state.displayName,
        timezone: state.timezone,
        ageRange: state.ageRange ?? undefined,
        healthConditions: state.healthConditions.length > 0 ? state.healthConditions : undefined,
        healthAdvisoryAcknowledged: state.healthAdvisoryAcknowledged,
        goals: state.goals.length > 0 ? state.goals : undefined,
        setupTier: state.setupTier,
        habits: state.habits.filter((h) => h.isActive),
        startDate: state.startDate,
        visibility: state.visibility,
      });

      // Keep session storage alive for the tutorial page to read theme/habits
      sessionStorage.removeItem(STEP_KEY);

      router.push("/onboarding/tutorial");
    } catch (err) {
      console.error("Onboarding failed:", err);
      setIsSubmitting(false);
    }
  }, [user, isSubmitting, state, completeOnboarding, setPersonality, router]);

  if (user === undefined) {
    return (
      <div className="space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (user === null) {
    // Not authenticated — redirect to sign in
    router.replace("/sign-in");
    return null;
  }

  const currentStep = ONBOARDING_STEPS[stepIndex];

  return (
    <div className="space-y-8">
      <StepIndicator
        steps={ONBOARDING_STEPS}
        currentIndex={stepIndex}
      />

      {currentStep === "welcome" && (
        <OnboardingWelcome state={state} updateState={updateState} onNext={next} />
      )}
      {currentStep === "goals" && (
        <OnboardingGoals state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "theme" && (
        <OnboardingTheme state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "tier" && (
        <OnboardingTierSelect state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "habits" && (
        <OnboardingHabitConfig state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "review" && (
        <OnboardingReview
          state={state}
          updateState={updateState}
          onBack={back}
          onGoToStep={goToStep}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
