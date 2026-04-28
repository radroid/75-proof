"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useThemePersonality } from "@/components/theme-provider";
import { setStoredPersonality } from "@/lib/themes";
import {
  getTemplateBySlug,
  isKnownTemplate,
  DEFAULT_TEMPLATE_SLUG,
} from "@/lib/routine-templates";
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
import { OnboardingPathSelect } from "@/components/onboarding/OnboardingPathSelect";
import { OnboardingWelcome } from "@/components/onboarding/OnboardingWelcome";
import { OnboardingGoals } from "@/components/onboarding/OnboardingGoals";
import { OnboardingTheme } from "@/components/onboarding/OnboardingTheme";
import { OnboardingBrowsePopular } from "@/components/onboarding/OnboardingBrowsePopular";
import { OnboardingAiStep } from "@/components/onboarding/OnboardingAiStep";
import { OnboardingDuration } from "@/components/onboarding/OnboardingDuration";
import { OnboardingHabitConfig } from "@/components/onboarding/OnboardingHabitConfig";
import { OnboardingIdentity } from "@/components/onboarding/OnboardingIdentity";
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
  // Track the furthest step the user has reached so the StepIndicator
  // can render visited dots as clickable shortcuts back. Forward jumps
  // are still gated by the per-step Continue button so we never land on
  // a screen whose required input hasn't been collected yet.
  const [maxReachedIndex, setMaxReachedIndex] = useState(loadStep);
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
    const previousSlug = previousState.templateSlug;
    const seededTemplateSlug = isKnownTemplate(previousSlug)
      ? (previousSlug as string)
      : DEFAULT_TEMPLATE_SLUG;
    // When the previous run captured habits, reuse them. Otherwise derive
    // from the seeded template — falling back to INITIAL_ONBOARDING_STATE
    // would leave a Yoga-slug user staring at 75 HARD's habit list.
    const seededHabits =
      previousState.habits.length > 0
        ? previousState.habits
        : getTemplateBySlug(seededTemplateSlug).habits.map((h) => ({
            ...h,
            isActive: true,
          }));
    const seeded: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      displayName: previousState.displayName,
      timezone: previousState.timezone,
      ageRange: previousState.ageRange,
      healthConditions: previousState.healthConditions,
      healthAdvisoryAcknowledged: previousState.healthAdvisoryAcknowledged,
      goals: previousState.goals,
      setupTier: previousState.setupTier,
      habits: seededHabits,
      daysTotal: previousState.daysTotal ?? INITIAL_ONBOARDING_STATE.daysTotal,
      templateSlug: seededTemplateSlug,
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

  // Built-in templates (75 HARD, 30-Day Yoga) hide the duration step and
  // pin daysTotal to the template's value. AI-generated and unknown slugs
  // resolve to `null` here so they fall through to the user-chosen
  // duration — `getTemplateBySlug` would silently default to 75 HARD and
  // make a personalized 30-day plan look like a strict 75-day challenge.
  const selectedTemplate = isKnownTemplate(state.templateSlug)
    ? getTemplateBySlug(state.templateSlug)
    : null;
  // Custom path skips the template step entirely — the build-your-own
  // habits are seeded at the path picker, so there's nothing to choose.
  const skipsTemplate = state.entryPath === "custom";
  const skipsDuration = !!selectedTemplate?.lockedDuration;
  // AI path delegates everything except age + health acknowledgement to the
  // coach conversation. Skip the standard goals/theme/duration/habits steps
  // so the only stops are: path → welcome (age + T&C) → template (AI chat) →
  // review. Keeping the steps available via dot-jump would let a user land
  // on questions we promised the coach would handle.
  const isAiPath = state.entryPath === "ai";

  // Indices of steps that are currently skipped by the flow. Both the
  // dot navigator and `goToIndex` consult this so a user can never land
  // on a step the forward flow would have stepped past anyway.
  const disabledStepIndices = useMemo(() => {
    const set = new Set<number>();
    ONBOARDING_STEPS.forEach((step, idx) => {
      if (step === "template" && skipsTemplate) set.add(idx);
      if (step === "duration" && skipsDuration) set.add(idx);
      if (isAiPath && (step === "goals" || step === "theme" || step === "duration" || step === "habits")) {
        set.add(idx);
      }
    });
    return set;
  }, [skipsTemplate, skipsDuration, isAiPath]);

  // Helper to advance state. Co-locating the `maxReachedIndex` bump with
  // the `setStepIndex` call avoids the cascading render the
  // react-hooks/set-state-in-effect lint rule would flag if we did it in
  // an effect on `[stepIndex]`.
  const setStepBoth = useCallback((newIdx: number) => {
    setStepIndex(newIdx);
    setMaxReachedIndex((prev) => Math.max(prev, newIdx));
  }, []);

  // When the review screen jumps the user into an earlier step to edit a
  // value, we stash the review index here so `back` can return them to
  // review on a single tap. Without this, AI users editing from review
  // would land on `welcome` (the previous step in the AI flow) instead
  // of bouncing back to where they started the edit.
  const returnToIndexRef = useRef<number | null>(null);

  const next = useCallback(() => {
    let nextIdx = Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1);
    // Loop past every disabled step. The AI path skips four in a row
    // (goals → theme → duration → habits) so a single hop isn't enough.
    while (
      nextIdx < ONBOARDING_STEPS.length - 1 &&
      disabledStepIndices.has(nextIdx)
    ) {
      nextIdx += 1;
    }
    // Forward flow invalidates any pending return-to-review intent.
    returnToIndexRef.current = null;
    setStepBoth(nextIdx);
    if (
      selectedTemplate?.lockedDuration &&
      state.daysTotal !== selectedTemplate.daysTotal
    ) {
      setState((s) => ({ ...s, daysTotal: selectedTemplate.daysTotal }));
    }
  }, [stepIndex, selectedTemplate, state.daysTotal, disabledStepIndices, setStepBoth]);

  const back = useCallback(() => {
    const returnIdx = returnToIndexRef.current;
    if (returnIdx !== null) {
      returnToIndexRef.current = null;
      setStepBoth(returnIdx);
      return;
    }
    let prevIdx = Math.max(stepIndex - 1, 0);
    while (prevIdx > 0 && disabledStepIndices.has(prevIdx)) {
      prevIdx -= 1;
    }
    setStepBoth(prevIdx);
  }, [stepIndex, disabledStepIndices, setStepBoth]);

  const goToStep = useCallback(
    (step: OnboardingStep, options?: { returnTo?: OnboardingStep }) => {
      const idx = ONBOARDING_STEPS.indexOf(step);
      if (idx < 0) return;
      const returnIdx = options?.returnTo
        ? ONBOARDING_STEPS.indexOf(options.returnTo)
        : -1;
      // Stash the desired return step (or clear stale state if none was
      // requested) so `back` can pop to it once and then resume normal
      // single-step traversal.
      returnToIndexRef.current = returnIdx >= 0 ? returnIdx : null;
      setStepBoth(idx);
    },
    [setStepBoth],
  );

  // Click handler for the StepIndicator dots. Only allow jumping to a
  // step the user has already reached, AND that the current flow doesn't
  // skip — otherwise a custom-path user could click the (silent) template
  // dot or a locked-template user could click the duration dot and land
  // on a screen the forward flow would never have shown them.
  const goToIndex = useCallback(
    (idx: number) => {
      if (idx > maxReachedIndex) return;
      if (disabledStepIndices.has(idx)) return;
      setStepIndex(idx);
    },
    [maxReachedIndex, disabledStepIndices],
  );

  const handleComplete = useCallback(async () => {
    if (isSubmitting) return;
    if (!isGuest && !user) return;
    setIsSubmitting(true);
    try {
      // Apply theme
      setPersonality(state.theme);
      setStoredPersonality(state.theme);

      // Locked-duration built-in templates always use the template's value.
      // AI-generated and unknown slugs (e.g. "ai-generated:*") fall through
      // to the user-picked duration and the user-chosen setupTier so we
      // don't silently coerce a personalized plan into the 75 HARD strict
      // 75-day shape.
      const knownTemplate = isKnownTemplate(state.templateSlug)
        ? getTemplateBySlug(state.templateSlug)
        : null;
      const finalDaysTotal = knownTemplate?.lockedDuration
        ? knownTemplate.daysTotal
        : state.daysTotal;
      const finalSetupTier: "original" | "added" =
        knownTemplate == null
          ? state.setupTier
          : knownTemplate.strictMode
            ? "original"
            : "added";

      // Local mode has no friend graph and nothing leaves the device, so
      // "friends"/"public" visibility is meaningless. Pin to "private" on
      // submit even if the state happens to carry a stale value (e.g. the
      // re-onboarding seed inherited it from a prior Convex flow, or it
      // was the default before the local-mode visibility selector got
      // hidden in this PR).
      const submittedVisibility = isGuest ? ("private" as const) : state.visibility;

      const trimmedIdentity = state.identityStatement.trim();
      const args = {
        displayName: state.displayName,
        timezone: state.timezone,
        ageRange: state.ageRange ?? undefined,
        healthConditions:
          state.healthConditions.length > 0 ? state.healthConditions : undefined,
        healthAdvisoryAcknowledged: state.healthAdvisoryAcknowledged,
        goals: state.goals.length > 0 ? state.goals : undefined,
        setupTier: finalSetupTier,
        habits: state.habits.filter((h) => h.isActive),
        startDate: state.startDate,
        visibility: submittedVisibility,
        daysTotal: finalDaysTotal,
        templateSlug: state.templateSlug,
        identityStatement:
          trimmedIdentity.length > 0 ? trimmedIdentity : undefined,
      } as const;

      if (isGuest) {
        localCompleteOnboarding(args);
      } else {
        await completeOnboardingConvex(args);
      }

      posthog.capture("onboarding_completed", {
        setup_tier: finalSetupTier,
        template_slug: state.templateSlug,
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

  const handleAiProposal = useCallback(
    (proposal: {
      title: string;
      daysTotal: number;
      habits: OnboardingState["habits"];
      strictMode: boolean;
    }) => {
      const aiSlug = `ai-generated:${Date.now()}`;
      // Belt-and-suspenders: the chat panel already sets isActive, but
      // RoutineProposal.habits doesn't carry it as a contract, so re-affirm
      // here before the review-step filter drops any habit that arrived
      // without the flag.
      setState((s) => ({
        ...s,
        templateSlug: aiSlug,
        habits: proposal.habits.map((h) => ({ ...h, isActive: true })),
        daysTotal: proposal.daysTotal,
        setupTier: proposal.strictMode ? "original" : "added",
      }));
      goToStep("review");
    },
    [goToStep],
  );

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
  // The AI coach owns the entire viewport — no side text, no max-width
  // clamp, no progress dots taking up the top of the chat. Everything else
  // stays in the standard `max-w-2xl` form column.
  const isAiChatStep = currentStep === "template" && state.entryPath === "ai";

  if (isAiChatStep) {
    // No outer padding — the chat owns the entire viewport and manages its
    // own safe-area inset on the composer.
    return (
      <OnboardingAiStep
        state={state}
        onBack={back}
        onApplyProposal={handleAiProposal}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-[max(env(safe-area-inset-bottom),2rem)] space-y-8">
      <StepIndicator
        steps={ONBOARDING_STEPS}
        currentIndex={stepIndex}
        maxReachedIndex={maxReachedIndex}
        disabledIndices={disabledStepIndices}
        onStepClick={goToIndex}
      />

      {currentStep === "path" && (
        <OnboardingPathSelect state={state} updateState={updateState} onNext={next} />
      )}
      {currentStep === "welcome" && (
        <OnboardingWelcome state={state} updateState={updateState} onNext={next} />
      )}
      {currentStep === "goals" && (
        <OnboardingGoals state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "theme" && (
        <OnboardingTheme state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "template" && state.entryPath !== "ai" && (
        <OnboardingBrowsePopular
          state={state}
          updateState={updateState}
          onNext={next}
          onBack={back}
        />
      )}
      {currentStep === "duration" && (
        <OnboardingDuration state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "habits" && (
        <OnboardingHabitConfig state={state} updateState={updateState} onNext={next} onBack={back} />
      )}
      {currentStep === "identity" && (
        <OnboardingIdentity state={state} updateState={updateState} onNext={next} onBack={back} />
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
