"use client";

import { useEffect, useSyncExternalStore } from "react";
import { localStore } from "./store";
import type { LocalDB } from "./db";
import * as q from "./queries";

export { localStore };

function subscribe(fn: () => void): () => void {
  return localStore.subscribe(fn);
}

export function useLocalDB(): LocalDB {
  return useSyncExternalStore(
    subscribe,
    () => localStore.getSnapshot(),
    () => localStore.getServerSnapshot(),
  );
}

export function useLocalUser() {
  return useLocalDB().user;
}

export function useLocalActiveChallenge() {
  const db = useLocalDB();
  return q.getActiveChallenge(db);
}

export function useLocalChallenge(challengeId: string | undefined) {
  const db = useLocalDB();
  if (!challengeId) return null;
  return q.getChallenge(db, challengeId);
}

export function useLocalUserChallenges() {
  const db = useLocalDB();
  return q.getUserChallenges(db);
}

export function useLocalActiveHabitDefinitions(challengeId: string | undefined) {
  const db = useLocalDB();
  if (!challengeId) return undefined;
  return q.getActiveHabitDefinitions(db, challengeId);
}

export function useLocalHabitDefinitions(challengeId: string | undefined) {
  const db = useLocalDB();
  if (!challengeId) return undefined;
  return q.getHabitDefinitions(db, challengeId);
}

export function useLocalEntriesForDay(
  challengeId: string | undefined,
  dayNumber: number,
) {
  const db = useLocalDB();
  if (!challengeId) return undefined;
  return q.getEntriesForDay(db, challengeId, dayNumber);
}

export function useLocalAllEntriesForChallenge(challengeId: string | undefined) {
  const db = useLocalDB();
  if (!challengeId) return undefined;
  return q.getAllEntriesForChallenge(db, challengeId);
}

export function useLocalDayCompletionMap(challengeId: string | undefined) {
  const db = useLocalDB();
  if (!challengeId) return undefined;
  return q.getDayCompletionMap(db, challengeId);
}

export function useLocalLifetimeStats() {
  const db = useLocalDB();
  return q.getLifetimeStats(db);
}

/**
 * Local-mode counterpart of `api.onboarding.getPreviousOnboardingState`.
 * Returns null until first onboarding has completed; afterwards returns the
 * shape the onboarding page knows how to seed from.
 */
export function useLocalPreviousOnboardingState() {
  const db = useLocalDB();
  return q.getPreviousOnboardingState(db);
}

/** Detects whether localStorage has data. SSR-safe: returns false on server. */
export function useHasLocalData(): boolean {
  const user = useLocalUser();
  return !!user;
}

/**
 * True once the local store has finished its first read from
 * `localStorage`. Use to gate "redirect to onboarding if no data"
 * effects — without this, a returning user races the dashboard's
 * empty-state effect and gets bounced to /onboarding before their
 * data hydrates.
 */
export function useLocalHydrationComplete(): boolean {
  // Re-read on every notify so the bool flips with the rest of the cache.
  useLocalDB();
  return localStore.hydrationComplete;
}

/**
 * One-shot hydration trigger for code paths (like the dashboard layout) that
 * need to read the local store synchronously on first paint. Without this
 * hook, hydration only happens when something subscribes — fine for the
 * common case but not for early redirect logic.
 */
export function useHydrateLocalStore(): void {
  useEffect(() => {
    localStore.hydrate();
  }, []);
}
