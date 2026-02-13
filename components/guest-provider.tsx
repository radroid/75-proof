"use client";

import { createContext, useContext, useMemo } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import {
  DEMO_USER,
  DEMO_CHALLENGE,
  DEMO_DAILY_LOG,
  getDemoChallengeLogs,
  DEMO_LIFETIME_STATS,
} from "@/lib/demo-data";

interface GuestContextValue {
  isGuest: boolean;
  promptSignup: () => void;
  demoUser: typeof DEMO_USER;
  demoChallenge: typeof DEMO_CHALLENGE;
  demoDailyLog: typeof DEMO_DAILY_LOG;
  demoChallengeLogs: ReturnType<typeof getDemoChallengeLogs>;
  demoLifetimeStats: typeof DEMO_LIFETIME_STATS;
}

const GuestContext = createContext<GuestContextValue | null>(null);

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();

  const value = useMemo<GuestContextValue>(() => {
    const isGuest = isLoaded && !isSignedIn;
    return {
      isGuest: !!isGuest,
      promptSignup: () => clerk.openSignUp(),
      demoUser: DEMO_USER,
      demoChallenge: DEMO_CHALLENGE,
      demoDailyLog: DEMO_DAILY_LOG,
      demoChallengeLogs: getDemoChallengeLogs(),
      demoLifetimeStats: DEMO_LIFETIME_STATS,
    };
  }, [isSignedIn, isLoaded, clerk]);

  return (
    <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
