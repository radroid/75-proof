"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGuest } from "@/components/guest-provider";
import { useLocalUser } from "@/lib/local-store/hooks";
import { InstallPrompt } from "./install-prompt";

const VISITED_KEY = "75proof_dashboard_visited";

// Engagement heuristic: only prompt after the user has reached the dashboard
// at least once AND is past onboarding. First visit just records the flag so
// we don't nag brand-new visitors.
function useHasVisitedDashboardBefore(onDashboard: boolean): boolean {
  const [visitedBefore, setVisitedBefore] = useState(false);

  useEffect(() => {
    if (!onDashboard) return;
    if (typeof window === "undefined") return;
    try {
      const prior = window.localStorage.getItem(VISITED_KEY);
      if (prior) {
        setVisitedBefore(true);
      } else {
        window.localStorage.setItem(VISITED_KEY, new Date().toISOString());
      }
    } catch {
      // localStorage blocked — treat as not-yet-visited, skip prompt.
    }
  }, [onDashboard]);

  return visitedBefore;
}

export function InstallPromptGate() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { isGuest } = useGuest();

  const convexUser = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn && !isGuest ? {} : "skip",
  );
  const localUser = useLocalUser();

  const onDashboard = pathname === "/dashboard";
  const visitedBefore = useHasVisitedDashboardBefore(onDashboard);

  if (!isLoaded) return null;
  if (!onDashboard) return null;
  if (!visitedBefore) return null;

  if (isGuest) {
    if (!localUser?.onboardingComplete) return null;
    return <InstallPrompt />;
  }

  if (!isSignedIn) return null;
  if (!convexUser || !convexUser.onboardingComplete) return null;
  return <InstallPrompt />;
}
