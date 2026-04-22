"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import posthog from "posthog-js";
import { useThemePersonality } from "@/components/theme-provider";

export function PostHogUserIdentifier() {
  const { user: clerkUser, isLoaded } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const challenge = useQuery(
    api.challenges.getChallenge,
    convexUser?.currentChallengeId ? { challengeId: convexUser.currentChallengeId } : "skip",
  );
  const { personality } = useThemePersonality();

  useEffect(() => {
    if (!isLoaded) return;
    if (!clerkUser) {
      posthog.reset();
      return;
    }

    posthog.identify(clerkUser.id, {
      email: clerkUser.primaryEmailAddress?.emailAddress,
      name: clerkUser.fullName ?? clerkUser.username,
      created_at: clerkUser.createdAt?.toISOString(),
      onboarding_complete: convexUser?.onboardingComplete ?? false,
      display_name: convexUser?.displayName,
      timezone: convexUser?.preferences?.timezone,
      longest_streak: convexUser?.longestStreak ?? 0,
      lifetime_restart_count: convexUser?.lifetimeRestartCount ?? 0,
      has_active_challenge: !!convexUser?.currentChallengeId,
      current_day: challenge?.currentDay ?? 0,
      challenge_status: challenge?.status,
      theme: personality,
    });
  }, [isLoaded, clerkUser, convexUser, challenge, personality]);

  return null;
}
