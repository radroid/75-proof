"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGuest } from "@/components/guest-provider";
import { useLocalUser } from "@/lib/local-store/hooks";
import { NotificationPermissionPrompt } from "./notification-permission-prompt";
import { LocalNotificationPrompt } from "./local-notification-prompt";

// Track dashboard visits separately from the install prompt so both prompts
// can coexist without interfering.
const VISITED_KEY = "75proof_notif_dashboard_visited";

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
      // localStorage blocked — treat as first visit; we just won't prompt.
    }
  }, [onDashboard]);

  return visitedBefore;
}

/**
 * Gate component: decides when (and whether) the notification permission
 * prompt should appear. Mirrors the install prompt gate logic — only shows
 * on /dashboard, for signed-in (non-guest) users who've completed onboarding
 * and have visited the dashboard at least once already.
 *
 * We keep this lightweight: "second dashboard visit" rather than plumbing
 * "completed ≥1 habit today" through every themed dashboard. Good enough
 * for iter D; iter E can refine.
 */
export function NotificationPromptGate() {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { isGuest } = useGuest();

  const user = useQuery(
    api.users.getCurrentUser,
    isLoaded && isSignedIn && !isGuest ? {} : "skip",
  );
  const localUser = useLocalUser();

  const onDashboard = pathname === "/dashboard";
  const visitedBefore = useHasVisitedDashboardBefore(onDashboard);

  if (!isLoaded) return null;
  if (!onDashboard) return null;

  // Local mode: use the in-page Notification API only, no Web Push.
  if (isGuest) {
    if (!localUser?.onboardingComplete) return null;
    return (
      <div className="mb-4">
        <LocalNotificationPrompt enabled={visitedBefore} />
      </div>
    );
  }

  if (!isSignedIn) return null;
  if (!user || !user.onboardingComplete) return null;

  return (
    <div className="mb-4">
      <NotificationPermissionPrompt enabled={visitedBefore} />
    </div>
  );
}
