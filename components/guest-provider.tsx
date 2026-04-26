"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { localStore } from "@/lib/local-store/store";
import {
  useHasLocalData,
  useHydrateLocalStore,
  useLocalActiveChallenge,
  useLocalLifetimeStats,
  useLocalUser,
  useLocalAllEntriesForChallenge,
} from "@/lib/local-store/hooks";

const LOCAL_OPT_IN_KEY = "75proof:local:opted-in";

interface GuestContextValue {
  /**
   * True when the visitor is operating in local-only mode (no Clerk auth).
   * Name kept for diff continuity — historically meant "read-only demo guest";
   * now means "persistent local-mode user."
   */
  isGuest: boolean;
  /** True when the user has explicitly opted in to local mode. */
  isLocalOptedIn: boolean;
  /**
   * False during the brief window between mount and the first effect
   * cycle while we determine whether this browser has a persisted
   * opt-in flag and/or hydrated local data. Layout/dashboard redirect
   * effects must wait for this to be true — otherwise a returning
   * local user races the empty-state branch and gets bounced.
   */
  isResolved: boolean;
  /** Resolve a sign-up flow. Used by the Banner CTA. */
  promptSignup: () => void;
  /** Switch this browser into local mode and route to onboarding. */
  enterLocalMode: () => void;
  /** Erase all local data. Used by Settings-equivalent affordances. */
  resetLocal: () => void;
  /**
   * Live local data. Only meaningful when `isGuest === true`. Components
   * still in the legacy "demo" code paths read these via the same names.
   */
  demoUser: ReturnType<typeof useLocalUser>;
  demoChallenge: ReturnType<typeof useLocalActiveChallenge>;
  /** Local entries for the active challenge. Replaces old static logs. */
  demoChallengeLogs: unknown[];
  demoLifetimeStats: ReturnType<typeof useLocalLifetimeStats>;
}

const GuestContext = createContext<GuestContextValue | null>(null);

function readLocalOptIn(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(LOCAL_OPT_IN_KEY) === "1";
  } catch {
    return false;
  }
}

function writeLocalOptIn(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_OPT_IN_KEY, "1");
  } catch {
    /* noop */
  }
}

function clearLocalOptIn(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(LOCAL_OPT_IN_KEY);
  } catch {
    /* noop */
  }
}

export function GuestProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const clerk = useClerk();
  const router = useRouter();
  useHydrateLocalStore();

  const localUser = useLocalUser();
  const localChallenge = useLocalActiveChallenge();
  const localLifetimeStats = useLocalLifetimeStats();
  const localEntries = useLocalAllEntriesForChallenge(
    localChallenge?._id ?? undefined,
  );
  const hasLocalData = useHasLocalData();

  // SSR-safe opt-in: render `false` on the server (no localStorage) and
  // sync to the persisted flag on mount. Keeping it in state makes
  // `isGuest` reactive — `enterLocalMode` flips it via setState, so
  // every consumer re-renders without depending on a non-reactive
  // localStorage read inside render.
  const [optInPersisted, setOptInPersisted] = useState(false);
  const [optInResolved, setOptInResolved] = useState(false);
  useEffect(() => {
    setOptInPersisted(readLocalOptIn());
    setOptInResolved(true);
  }, []);

  // Mirror opt-in changes from other tabs. Without this, signing in or
  // resetting local mode in tab A leaves tab B with a stale `isGuest`
  // until a full reload — which then routes the wrong UI for that tab.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCAL_OPT_IN_KEY) return;
      setOptInPersisted(event.newValue === "1");
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const isLocalOptedIn = optInPersisted || hasLocalData;
  const isGuest = isLoaded && !isSignedIn && isLocalOptedIn;
  // "Resolved" is true once we have authoritative answers for both
  // Clerk's auth state and our local opt-in state. Gates that decide
  // "redirect this user away" should wait for it.
  const isResolved = isLoaded && optInResolved;

  const enterLocalMode = useCallback(() => {
    writeLocalOptIn();
    setOptInPersisted(true);
    router.push("/onboarding");
  }, [router]);

  const resetLocal = useCallback(() => {
    clearLocalOptIn();
    setOptInPersisted(false);
    localStore.reset();
    router.push("/");
  }, [router]);

  // Once authenticated, drop any latent local opt-in flag so the next
  // sign-out doesn't auto-resume local mode silently. (Local data in the
  // store itself is preserved — see DECISIONS.md gap on data migration.)
  useEffect(() => {
    if (isSignedIn) {
      clearLocalOptIn();
      setOptInPersisted(false);
    }
  }, [isSignedIn]);

  const value = useMemo<GuestContextValue>(
    () => ({
      isGuest,
      isLocalOptedIn,
      isResolved,
      promptSignup: () => clerk.openSignUp(),
      enterLocalMode,
      resetLocal,
      demoUser: localUser,
      demoChallenge: localChallenge,
      demoChallengeLogs: localEntries ?? [],
      demoLifetimeStats: localLifetimeStats,
    }),
    [
      isGuest,
      isLocalOptedIn,
      isResolved,
      clerk,
      enterLocalMode,
      resetLocal,
      localUser,
      localChallenge,
      localEntries,
      localLifetimeStats,
    ],
  );

  return (
    <GuestContext.Provider value={value}>{children}</GuestContext.Provider>
  );
}

export function useGuest() {
  const ctx = useContext(GuestContext);
  if (!ctx) throw new Error("useGuest must be used within GuestProvider");
  return ctx;
}
