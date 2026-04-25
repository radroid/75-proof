"use client";

import { localStore } from "./store";
import type {
  LocalChallenge,
  LocalDB,
  LocalHabitDefinition,
  LocalHabitEntry,
  LocalUser,
} from "./db";
import { computeDayNumber, getDateForDay, getTodayInTimezone } from "@/lib/day-utils";

/**
 * Local-mode mutations — same surface as the Convex mutations they replace,
 * minus auth checks (we ARE the user) and minus social fan-out.
 */

interface OnboardingHabitInput {
  name: string;
  blockType: "task" | "counter";
  target?: number;
  unit?: string;
  isHard: boolean;
  isActive: boolean;
  category: string;
  sortOrder: number;
  icon?: string;
}

export interface CompleteOnboardingArgs {
  displayName: string;
  timezone: string;
  ageRange?: string;
  healthConditions?: string[];
  healthAdvisoryAcknowledged: boolean;
  goals?: string[];
  setupTier: "original" | "added";
  habits: OnboardingHabitInput[];
  startDate: string;
  visibility: "private" | "friends" | "public";
  daysTotal: number;
}

function genId(table: string): string {
  return `local_${table}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function ensureUser(draft: LocalDB): LocalUser {
  if (draft.user) return draft.user;
  draft.user = {
    _id: "local_user",
    _creationTime: Date.now(),
    clerkId: "local",
    displayName: "You",
    preferences: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      waterUnit: "oz",
      sharing: {
        showStreak: true,
        showDayNumber: true,
        showCompletionStatus: true,
      },
    },
  };
  return draft.user;
}

export function completeOnboarding(args: CompleteOnboardingArgs): string {
  const finalDaysTotal = args.setupTier === "original" ? 75 : args.daysTotal;
  let challengeId = "";
  localStore.write((draft) => {
    const user = ensureUser(draft);
    if (user.currentChallengeId) {
      const existing = draft.challenges.find(
        (c) => c._id === user.currentChallengeId,
      );
      if (existing && existing.status === "active") {
        throw new Error("User already has an active challenge");
      }
    }

    challengeId = genId("challenge");
    const challenge: LocalChallenge = {
      _id: challengeId,
      _creationTime: Date.now(),
      userId: user._id,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: args.visibility,
      restartCount: 0,
      setupTier: args.setupTier,
      daysTotal: finalDaysTotal,
    };
    draft.challenges.push(challenge);

    for (const habit of args.habits) {
      const def: LocalHabitDefinition = {
        _id: genId("habitDef"),
        _creationTime: Date.now(),
        challengeId,
        userId: user._id,
        name: habit.name,
        blockType: habit.blockType,
        target: habit.target,
        unit: habit.unit,
        isHard: habit.isHard,
        isActive: habit.isActive,
        sortOrder: habit.sortOrder,
        category: habit.category,
        icon: habit.icon,
      };
      draft.habitDefinitions.push(def);
    }

    user.displayName = args.displayName;
    user.currentChallengeId = challengeId;
    user.onboardingComplete = true;
    user.onboarding = {
      completedAt: new Date().toISOString(),
      ageRange: args.ageRange,
      healthConditions: args.healthConditions,
      goals: args.goals,
      healthAdvisoryAcknowledged: args.healthAdvisoryAcknowledged,
      setupTier: args.setupTier,
    };
    user.preferences = {
      ...user.preferences,
      timezone: args.timezone,
    };

    draft.activityFeed.push({
      _id: genId("feed"),
      _creationTime: Date.now(),
      userId: user._id,
      type: "challenge_started",
      challengeId,
      message:
        finalDaysTotal === 75
          ? "Started the 75 HARD challenge!"
          : `Started a ${finalDaysTotal}-day challenge!`,
      createdAt: new Date().toISOString(),
    });
  });
  return challengeId;
}

export function toggleTaskEntry(args: {
  habitDefinitionId: string;
  challengeId: string;
  dayNumber: number;
  date: string;
}): void {
  localStore.write((draft) => {
    const user = ensureUser(draft);
    const existing = draft.habitEntries.find(
      (e) =>
        e.habitDefinitionId === args.habitDefinitionId &&
        e.dayNumber === args.dayNumber,
    );
    if (existing) {
      const idx = draft.habitEntries.indexOf(existing);
      draft.habitEntries[idx] = { ...existing, completed: !existing.completed };
      return;
    }
    const entry: LocalHabitEntry = {
      _id: genId("entry"),
      _creationTime: Date.now(),
      habitDefinitionId: args.habitDefinitionId,
      challengeId: args.challengeId,
      userId: user._id,
      dayNumber: args.dayNumber,
      date: args.date,
      completed: true,
    };
    draft.habitEntries.push(entry);
  });
}

export function updateCounterEntry(args: {
  habitDefinitionId: string;
  challengeId: string;
  dayNumber: number;
  date: string;
  value: number;
}): void {
  localStore.write((draft) => {
    const user = ensureUser(draft);
    const habit = draft.habitDefinitions.find(
      (h) => h._id === args.habitDefinitionId,
    );
    const target = habit?.target;
    const completed = target ? args.value >= target : false;

    const existing = draft.habitEntries.find(
      (e) =>
        e.habitDefinitionId === args.habitDefinitionId &&
        e.dayNumber === args.dayNumber,
    );
    if (existing) {
      const idx = draft.habitEntries.indexOf(existing);
      draft.habitEntries[idx] = {
        ...existing,
        value: args.value,
        completed,
      };
      return;
    }
    const entry: LocalHabitEntry = {
      _id: genId("entry"),
      _creationTime: Date.now(),
      habitDefinitionId: args.habitDefinitionId,
      challengeId: args.challengeId,
      userId: user._id,
      dayNumber: args.dayNumber,
      date: args.date,
      value: args.value,
      completed,
    };
    draft.habitEntries.push(entry);
  });
}

/**
 * Mark a day "completed" — emits an activityFeed row (deduped). Same dedup
 * rule as Convex: one feed item per (challenge, dayNumber, type).
 */
export function markDayComplete(args: {
  challengeId: string;
  dayNumber: number;
}): void {
  localStore.write((draft) => {
    const user = draft.user;
    if (!user) return;
    const challenge = draft.challenges.find((c) => c._id === args.challengeId);
    if (!challenge) return;

    const existing = draft.activityFeed.find(
      (f) =>
        f.userId === user._id &&
        f.type === "day_completed" &&
        f.challengeId === args.challengeId &&
        f.dayNumber === args.dayNumber,
    );
    if (existing) return;

    const message = challenge.isHabitTracker
      ? `Completed Day ${args.dayNumber}!`
      : `Completed Day ${args.dayNumber} of ${challenge.daysTotal ?? 75}!`;
    draft.activityFeed.push({
      _id: genId("feed"),
      _creationTime: Date.now(),
      userId: user._id,
      type: "day_completed",
      challengeId: args.challengeId,
      dayNumber: args.dayNumber,
      message,
      createdAt: new Date().toISOString(),
    });
  });
}

/**
 * Sync `currentDay` to today's date and check for completion. Local-mode
 * counterpart of `checkChallengeStatus` — but with NO reconciliation,
 * NO auto-fail. Just advances the day pointer and emits milestones.
 */
export function syncChallengeStatus(args: {
  challengeId: string;
  userTimezone: string;
}): void {
  localStore.write((draft) => {
    const user = draft.user;
    if (!user) return;
    const challenge = draft.challenges.find((c) => c._id === args.challengeId);
    if (!challenge || challenge.status !== "active") return;

    const todayStr = getTodayInTimezone(args.userTimezone);
    const todayDayNumber = computeDayNumber(challenge.startDate, todayStr);
    const daysTotal = challenge.isHabitTracker
      ? null
      : challenge.daysTotal ?? 75;

    if (todayDayNumber < 1) {
      if (challenge.currentDay !== 1) {
        const idx = draft.challenges.indexOf(challenge);
        draft.challenges[idx] = { ...challenge, currentDay: 1 };
      }
      return;
    }

    // For bounded challenges that have run past their target, mark complete
    // when every required day is satisfied.
    if (daysTotal !== null && todayDayNumber > daysTotal) {
      const allDone = isEveryDayComplete(draft, challenge._id, daysTotal);
      if (allDone) {
        const idx = draft.challenges.indexOf(challenge);
        draft.challenges[idx] = {
          ...challenge,
          currentDay: daysTotal,
          status: "completed",
        };
        const longest = user.longestStreak ?? 0;
        if (daysTotal > longest) {
          draft.user = { ...user, longestStreak: daysTotal };
        }
        draft.activityFeed.push({
          _id: genId("feed"),
          _creationTime: Date.now(),
          userId: user._id,
          type: "challenge_completed",
          challengeId: challenge._id,
          dayNumber: daysTotal,
          message:
            daysTotal === 75
              ? "Completed the 75 HARD challenge!"
              : `Completed the ${daysTotal}-day challenge!`,
          createdAt: new Date().toISOString(),
        });
        return;
      }
    }

    const cap = (n: number) => (daysTotal === null ? n : Math.min(n, daysTotal));
    const syncDay = cap(Math.max(todayDayNumber, 1));
    if (challenge.currentDay !== syncDay) {
      const idx = draft.challenges.indexOf(challenge);
      draft.challenges[idx] = { ...challenge, currentDay: syncDay };
    }
  });
}

function isEveryDayComplete(
  draft: LocalDB,
  challengeId: string,
  daysTotal: number,
): boolean {
  const habitDefs = draft.habitDefinitions.filter(
    (h) => h.challengeId === challengeId && h.isActive && h.isHard,
  );
  if (habitDefs.length === 0) return false;
  const entries = draft.habitEntries.filter((e) => e.challengeId === challengeId);
  for (let day = 1; day <= daysTotal; day++) {
    const dayEntries = entries.filter((e) => e.dayNumber === day);
    const map = new Map(dayEntries.map((e) => [e.habitDefinitionId, e]));
    for (const h of habitDefs) {
      if (!map.get(h._id)?.completed) return false;
    }
  }
  return true;
}

export function updatePreferences(
  partial: Partial<LocalUser["preferences"]>,
): void {
  localStore.write((draft) => {
    if (!draft.user) return;
    draft.user = {
      ...draft.user,
      preferences: { ...draft.user.preferences, ...partial },
    };
  });
}

export function setNotificationsGranted(): void {
  localStore.write((draft) => {
    // Only meaningful after onboarding has created the user. Refuse to
    // auto-create a half-populated user from a stray notification prompt
    // — that would flip `useHasLocalData()` to true and bypass the
    // landing CTA flow on the user's next visit.
    const user = draft.user;
    if (!user) return;
    const existing = user.preferences.notifications;
    draft.user = {
      ...user,
      preferences: {
        ...user.preferences,
        notifications: {
          enabled: true,
          morningReminder: existing?.morningReminder ?? true,
          eveningReminder: existing?.eveningReminder ?? true,
          morningTime: existing?.morningTime ?? "08:00",
          eveningTime: existing?.eveningTime ?? "20:00",
          permissionGrantedAt: new Date().toISOString(),
        },
      },
    };
  });
}

/** Marks the dashboard tour as seen. Stub for parity with Convex API. */
export function markTutorialSeen(): void {
  localStore.write((draft) => {
    if (!draft.user) return;
    draft.user = { ...draft.user, hasSeenTutorial: true };
  });
}

export function updateDisplayName(displayName: string): void {
  const trimmed = displayName.trim();
  if (!trimmed) return;
  localStore.write((draft) => {
    if (!draft.user) return;
    draft.user = { ...draft.user, displayName: trimmed };
  });
}

export function updateWaterUnit(unit: "oz" | "ml"): void {
  localStore.write((draft) => {
    if (!draft.user) return;
    draft.user = {
      ...draft.user,
      preferences: { ...draft.user.preferences, waterUnit: unit },
    };
  });
}

/**
 * Extend the active challenge length. Same rules as the Convex mutation:
 * length can only go up, max 365 days, must be ≥ currentDay, no-op on
 * habit-tracker mode or failed challenges.
 */
export function extendChallengeDuration(args: {
  challengeId: string;
  newDaysTotal: number;
}): void {
  localStore.write((draft) => {
    const idx = draft.challenges.findIndex((c) => c._id === args.challengeId);
    if (idx === -1) return;
    const challenge = draft.challenges[idx];
    if (challenge.isHabitTracker) {
      throw new Error("Habit-tracker mode has no duration to extend");
    }
    if (challenge.status === "failed") {
      throw new Error("Cannot extend a failed challenge");
    }
    if (args.newDaysTotal > 365) {
      throw new Error("Challenge length cannot exceed 365 days");
    }
    const currentTotal = challenge.daysTotal ?? 75;
    if (args.newDaysTotal <= currentTotal) {
      throw new Error("Challenge length can only be increased");
    }
    if (args.newDaysTotal < challenge.currentDay) {
      throw new Error("New length must be at least the current day");
    }
    // Reactivating a completed challenge would silently orphan a different
    // active one. Refuse — same guard as the Convex `updateChallengeDuration`
    // mutation. In practice local mode allows only one active challenge at a
    // time, but matching the rule keeps behavior identical if we ever loosen
    // that elsewhere.
    if (challenge.status === "completed" && draft.user) {
      const otherActiveId = draft.user.currentChallengeId;
      if (otherActiveId && otherActiveId !== args.challengeId) {
        const other = draft.challenges.find((c) => c._id === otherActiveId);
        if (other && other.status === "active") {
          throw new Error(
            "Another active challenge is already in progress; finish it first",
          );
        }
      }
    }
    draft.challenges[idx] = {
      ...challenge,
      daysTotal: args.newDaysTotal,
      ...(challenge.status === "completed" ? { status: "active" as const } : {}),
    };
    if (challenge.status === "completed" && draft.user) {
      draft.user = { ...draft.user, currentChallengeId: args.challengeId };
    }
    draft.activityFeed.push({
      _id: genId("feed"),
      _creationTime: Date.now(),
      userId: challenge.userId,
      type: "milestone",
      challengeId: args.challengeId,
      dayNumber: challenge.currentDay,
      message: `Extended challenge to ${args.newDaysTotal} days`,
      createdAt: new Date().toISOString(),
    });
  });
}

/**
 * Convert the active or completed challenge into an open-ended habit
 * tracker. One-way (no UI to convert back). Refuses to act on failed
 * challenges.
 */
export function convertToHabitTracker(challengeId: string): void {
  localStore.write((draft) => {
    const idx = draft.challenges.findIndex((c) => c._id === challengeId);
    if (idx === -1) return;
    const challenge = draft.challenges[idx];
    if (challenge.isHabitTracker) return;
    if (challenge.status === "failed") {
      throw new Error("Cannot convert a failed challenge to a habit tracker");
    }
    draft.challenges[idx] = {
      ...challenge,
      isHabitTracker: true,
      status: "active",
    };
    if (draft.user && draft.user.currentChallengeId !== challengeId) {
      draft.user = { ...draft.user, currentChallengeId: challengeId };
    }
    draft.activityFeed.push({
      _id: genId("feed"),
      _creationTime: Date.now(),
      userId: challenge.userId,
      type: "milestone",
      challengeId,
      dayNumber: challenge.currentDay,
      message: "Converted to habit tracker — no end date",
      createdAt: new Date().toISOString(),
    });
  });
}

/**
 * Mark the active challenge as failed and clear the user's pointer.
 * Used by both reset paths below; not exported on its own to keep the
 * module surface tight.
 */
function failChallengeLocal(draft: LocalDB, challengeId: string, failedOnDay: number) {
  const idx = draft.challenges.findIndex((c) => c._id === challengeId);
  if (idx === -1) return;
  const challenge = draft.challenges[idx];
  draft.challenges[idx] = {
    ...challenge,
    status: "failed",
    failedOnDay,
    restartCount: (challenge.restartCount ?? 0) + 1,
  };
  if (draft.user) {
    const streakFromAttempt = Math.max(failedOnDay - 1, 0);
    const longest = draft.user.longestStreak ?? 0;
    draft.user = {
      ...draft.user,
      currentChallengeId: undefined,
      lifetimeRestartCount: (draft.user.lifetimeRestartCount ?? 0) + 1,
      longestStreak: Math.max(longest, streakFromAttempt),
    };
  }
  draft.activityFeed.push({
    _id: genId("feed"),
    _creationTime: Date.now(),
    userId: challenge.userId,
    type: "challenge_failed",
    challengeId,
    dayNumber: failedOnDay,
    message: `Challenge ended on Day ${failedOnDay}. Ready to start again!`,
    createdAt: new Date().toISOString(),
  });
}

/**
 * "Reset progress" path — fail the current challenge, then start a fresh
 * one with the same habits / setup tier / visibility. The user lands on
 * the dashboard with day 1.
 */
export function resetKeepingSetup(args: {
  challengeId: string;
  failedOnDay: number;
  startDate: string;
}): string {
  let newId = "";
  localStore.write((draft) => {
    const old = draft.challenges.find((c) => c._id === args.challengeId);
    if (!old) return;
    const oldHabits = draft.habitDefinitions.filter(
      (h) => h.challengeId === args.challengeId,
    );
    failChallengeLocal(draft, args.challengeId, args.failedOnDay);

    newId = genId("challenge");
    const carriedDaysTotal = old.daysTotal ?? 75;
    draft.challenges.push({
      _id: newId,
      _creationTime: Date.now(),
      userId: old.userId,
      startDate: args.startDate,
      currentDay: 1,
      status: "active",
      visibility: old.visibility,
      restartCount: 0,
      setupTier: old.setupTier,
      daysTotal: carriedDaysTotal,
      isHabitTracker: old.isHabitTracker,
    });
    for (const h of oldHabits) {
      draft.habitDefinitions.push({
        _id: genId("habitDef"),
        _creationTime: Date.now(),
        challengeId: newId,
        userId: h.userId,
        name: h.name,
        blockType: h.blockType,
        target: h.target,
        unit: h.unit,
        isHard: h.isHard,
        isActive: h.isActive,
        sortOrder: h.sortOrder,
        category: h.category,
        icon: h.icon,
      });
    }
    if (draft.user) {
      draft.user = { ...draft.user, currentChallengeId: newId };
    }
    const startMessage = old.isHabitTracker
      ? "Started a fresh habit tracker!"
      : carriedDaysTotal === 75
        ? "Started the 75 HARD challenge!"
        : `Started a ${carriedDaysTotal}-day challenge!`;
    draft.activityFeed.push({
      _id: genId("feed"),
      _creationTime: Date.now(),
      userId: old.userId,
      type: "challenge_started",
      challengeId: newId,
      message: startMessage,
      createdAt: new Date().toISOString(),
    });
  });
  return newId;
}

/**
 * "Reset & reconfigure" path — fail the current challenge and clear
 * `onboardingComplete` so the user gets routed back through onboarding.
 */
export function resetAndReOnboard(args: {
  challengeId: string;
  failedOnDay: number;
}): void {
  localStore.write((draft) => {
    failChallengeLocal(draft, args.challengeId, args.failedOnDay);
    if (draft.user) {
      draft.user = { ...draft.user, onboardingComplete: false };
    }
  });
}

/**
 * Used by `getDateForDay` callers — kept here for consistency, even though
 * it's a pure helper. Re-exported for component imports.
 */
export const getEntryDate = getDateForDay;
