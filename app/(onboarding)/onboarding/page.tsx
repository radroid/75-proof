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
import { useGuest } from "@/components/guest-provider";
import { completeOnboarding as localCompleteOnboarding } from "@/lib/local-store/mutations";
import {
  useLocalPreviousOnboardingState,
  useLocalUser,
} from "@/lib/local-store/hooks";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingGoals } from "@/components/onboarding/OnboardingGoals";
import { OnboardingTheme } from "@/components/onboarding/OnboardingTheme";
import { OnboardingTierSelect } from "@/components/onboarding/OnboardingTierSelect";
import { OnboardingDuration } from "@/components/onboarding/OnboardingDuration";
import { OnboardingHabitConfig } from "@/components/onboarding/OnboardingHabitConfig";
import { OnboardingReview } from "@/components/onboarding/OnboardingReview";
import { HeroSkeleton } from "@/components/ui/skeleton-enhanced";
import posthog from "posthog-js";

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
  const { isGuest, isLocalOptedIn, isResolved } = useGuest();
  // Wait for guest resolution before kicking off Convex queries — otherwise a
  // returning local-mode user (who reads `isGuest === false` for the first
  // render until `optInResolved` flips) would briefly trigger the signed-in
  // path and could be bounced to /sign-in before their local data hydrates.
  const convexUser = useQuery(
    api.users.getCurrentUser,
    !isResolved || isGuest ? "skip" : undefined,
  );
  const localUser = useLocalUser();
  const user = isGuest ? localUser : convexUser;
  const convexPreviousState = useQuery(
    api.onboarding.getPreviousOnboardingState,
    !isResolved || isGuest ? "skip" : undefined,
  );
  const localPreviousState = useLocalPreviousOnboardingState();
  // For local re-onboarding, surface the user's previous habit setup so they
  // don't have to rebuild from scratch — same UX as Convex re-onboarding.
  const previousState = isGuest ? localPreviousState : convexPreviousState;
  const completeOnboardingConvex = useMutation(api.onboarding.completeOnboarding);
  const { setPersonality } = useThemePersonality();

  const [state, setState] = useState<OnboardingState>(loadState);
  const [stepIndex, setStepIndex] = useState(loadStep);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [seededFromPrevious, setSeededFromPrevious] = useState(false);

  // Pre-populate from previous onboarding state (re-onboarding flow)
  // Only seed if sessionStorage was empty (fresh re-entry, not a mid-onboarding refresh)
  useEffect(() => {
    if (seededFromPrevious || !previousState) return;
    const hasExistingSession = typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) !== null;
    if (hasExistingSession) {
      setSeededFromPrevious(true);
      return;
    }
    const seeded: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      displayName: previousState.displayName,
      timezone: previousState.timezone,
      ageRange: previousState.ageRange,
      healthConditions: previousState.healthConditions,
      healthAdvisoryAcknowledged: previousState.healthAdvisoryAcknowledged,
      goals: previousState.goals,
      setupTier: previousState.setupTier,
      habits: previousState.habits.length > 0 ? previousState.habits : INITIAL_ONBOARDING_STATE.habits,
      daysTotal: previousState.daysTotal ?? INITIAL_ONBOARDING_STATE.daysTotal,
    };
    setState(seeded);
    setSeededFromPrevious(true);
  }, [previousState, seededFromPrevious]);

  // Populate displayName from user when available (first-time onboarding)
  useEffect(() => {
    if (user && !state.displayName && !seededFromPrevious) {
      setState((s) => ({ ...s, displayName: user.displayName }));
    }
  }, [user, state.displayName, seededFromPrevious]);

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

  // Original 75 HARD is a fixed 75-day commitment by definition, so the
  // duration step is hidden for that tier. Both next/back skip past it.
  const next = useCallback(() => {
    setStepIndex((i) => {
      let nextIdx = Math.min(i + 1, ONBOARDING_STEPS.length - 1);
      if (
        ONBOARDING_STEPS[nextIdx] === "duration" &&
        state.setupTier === "original"
      ) {
        nextIdx = Math.min(nextIdx + 1, ONBOARDING_STEPS.length - 1);
      }
      return nextIdx;
    });
    if (state.setupTier === "original" && state.daysTotal !== 75) {
      setState((s) => ({ ...s, daysTotal: 75 }));
    }
  }, [state.setupTier, state.daysTotal]);

  const back = useCallback(() => {
    setStepIndex((i) => {
      let prevIdx = Math.max(i - 1, 0);
      if (
        ONBOARDING_STEPS[prevIdx] === "duration" &&
        state.setupTier === "original"
      ) {
        prevIdx = Math.max(prevIdx - 1, 0);
      }
      return prevIdx;
    });
  }, [state.setupTier]);

  const goToStep = useCallback((step: OnboardingStep) => {
    const idx = ONBOARDING_STEPS.indexOf(step);
    if (idx >= 0) setStepIndex(idx);
  }, []);

  const handleComplete = useCallback(async () => {
    if (isSubmitting) return;
    if (!isGuest && !user) return;
    setIsSubmitting(true);
    try {
      // Apply theme
      setPersonality(state.theme);
      setStoredPersonality(state.theme);

      // Original tier is always 75 days regardless of any custom value the
      // user picked before flipping back to the original setup.
      const finalDaysTotal = state.setupTier === "original" ? 75 : state.daysTotal;

      // Local mode has no friend graph and nothing leaves the device, so
      // "friends"/"public" visibility is meaningless. Pin to "private" on
      // submit even if the state happens to carry a stale value (e.g. the
      // re-onboarding seed inherited it from a prior Convex flow, or it
      // was the default before the local-mode visibility selector got
      // hidden in this PR).
      const submittedVisibility = isGuest ? ("private" as const) : state.visibility;

      const args = {
        displayName: state.displayName,
        timezone: state.timezone,
        ageRange: state.ageRange ?? undefined,
        healthConditions:
          state.healthConditions.length > 0 ? state.healthConditions : undefined,
        healthAdvisoryAcknowledged: state.healthAdvisoryAcknowledged,
        goals: state.goals.length > 0 ? state.goals : undefined,
        setupTier: state.setupTier,
        habits: state.habits.filter((h) => h.isActive),
        startDate: state.startDate,
        visibility: submittedVisibility,
        daysTotal: finalDaysTotal,
      } as const;

      if (isGuest) {
        localCompleteOnboarding(args);
      } else {
        await completeOnboardingConvex(args);
      }

      posthog.capture("onboarding_completed", {
        setup_tier: state.setupTier,
        theme: state.theme,
        active_habit_count: state.habits.filter((h) => h.isActive).length,
        visibility: submittedVisibility,
        days_total: finalDaysTotal,
        is_re_onboarding: user?.hasSeenTutorial ?? false,
        local_mode: isGuest,
      });

      sessionStorage.removeItem(STEP_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/dashboard");
    } catch (err) {
      console.error("Onboarding failed:", err);
      setIsSubmitting(false);
    }
  }, [
    user,
    isSubmitting,
    state,
    completeOnboardingConvex,
    setPersonality,
    router,
    isGuest,
  ]);

  // Kick anonymous-and-not-local-mode users to sign-in. Side-effect goes
  // in an effect, not the render path, to avoid the "router.replace
  // during render" warning and the "redirect didn't commit" race.
  // Wait for `isResolved` so a returning local user isn't bounced before
  // their persisted opt-in flag has been read.
  useEffect(() => {
    if (isResolved && !isGuest && !isLocalOptedIn && user === null) {
      router.replace("/sign-in");
    }
  }, [isResolved, isGuest, isLocalOptedIn, user, router]);

  if (!isResolved || (!isGuest && user === undefined)) {
    return (
      <div className="space-y-6">
        <HeroSkeleton />
      </div>
    );
  }

  if (!isGuest && !isLocalOptedIn && user === null) {
    // While the redirect is in flight, render nothing.
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
      {currentStep === "duration" && (
        <OnboardingDuration state={state} updateState={updateState} onNext={next} onBack={back} />
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
