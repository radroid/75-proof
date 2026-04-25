import type { LocalDB, LocalChallenge, LocalHabitDefinition, LocalHabitEntry } from "./db";

export function getActiveChallenge(db: LocalDB): LocalChallenge | null {
  if (!db.user?.currentChallengeId) return null;
  const ch = db.challenges.find((c) => c._id === db.user!.currentChallengeId);
  return ch ?? null;
}

export function getChallenge(db: LocalDB, challengeId: string): LocalChallenge | null {
  return db.challenges.find((c) => c._id === challengeId) ?? null;
}

export function getUserChallenges(db: LocalDB): LocalChallenge[] {
  if (!db.user) return [];
  const userId = db.user._id;
  return db.challenges
    .filter((c) => c.userId === userId)
    .sort((a, b) => b._creationTime - a._creationTime);
}

export function getActiveHabitDefinitions(
  db: LocalDB,
  challengeId: string,
): LocalHabitDefinition[] {
  return db.habitDefinitions
    .filter((h) => h.challengeId === challengeId && h.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getHabitDefinitions(
  db: LocalDB,
  challengeId: string,
): LocalHabitDefinition[] {
  return db.habitDefinitions
    .filter((h) => h.challengeId === challengeId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getEntriesForDay(
  db: LocalDB,
  challengeId: string,
  dayNumber: number,
): LocalHabitEntry[] {
  return db.habitEntries.filter(
    (e) => e.challengeId === challengeId && e.dayNumber === dayNumber,
  );
}

export function getAllEntriesForChallenge(
  db: LocalDB,
  challengeId: string,
): LocalHabitEntry[] {
  return db.habitEntries.filter((e) => e.challengeId === challengeId);
}

/**
 * Per-day completion map. Mirrors `convex/challenges.getDayCompletionMap`
 * but only for the new (habit-definition) system, since local mode never
 * uses legacy `dailyLogs`.
 */
export function getDayCompletionMap(
  db: LocalDB,
  challengeId: string,
): Record<number, boolean> {
  const challenge = getChallenge(db, challengeId);
  if (!challenge) return {};
  const habitDefs = db.habitDefinitions.filter(
    (h) => h.challengeId === challengeId,
  );
  const hardHabits = habitDefs.filter((h) => h.isActive && h.isHard);

  const result: Record<number, boolean> = {};
  if (hardHabits.length === 0) {
    for (let day = 1; day <= challenge.currentDay; day++) {
      result[day] = false;
    }
    return result;
  }

  const entries = db.habitEntries.filter((e) => e.challengeId === challengeId);
  const entriesByDay = new Map<number, Map<string, LocalHabitEntry>>();
  for (const e of entries) {
    let byHabit = entriesByDay.get(e.dayNumber);
    if (!byHabit) {
      byHabit = new Map();
      entriesByDay.set(e.dayNumber, byHabit);
    }
    byHabit.set(e.habitDefinitionId, e);
  }

  for (let day = 1; day <= challenge.currentDay; day++) {
    const byHabit = entriesByDay.get(day);
    const complete =
      !!byHabit &&
      hardHabits.every((h) => !!byHabit.get(h._id)?.completed);
    result[day] = complete;
  }
  return result;
}

export interface LifetimeStats {
  lifetimeRestartCount: number;
  longestStreak: number;
  currentStreak: number;
  attemptNumber: number;
}

export function getLifetimeStats(db: LocalDB): LifetimeStats {
  const user = db.user;
  if (!user) {
    return { lifetimeRestartCount: 0, longestStreak: 0, currentStreak: 0, attemptNumber: 1 };
  }
  const lifetimeRestartCount = user.lifetimeRestartCount ?? 0;
  const longestStreak = user.longestStreak ?? 0;
  const attemptNumber = lifetimeRestartCount + 1;

  let currentStreak = 0;
  if (user.currentChallengeId) {
    const challenge = db.challenges.find(
      (c) => c._id === user.currentChallengeId,
    );
    if (challenge && challenge.status === "active") {
      const completionMap = getDayCompletionMap(db, challenge._id);
      for (let day = 1; day <= challenge.currentDay; day++) {
        if (completionMap[day]) {
          currentStreak = day;
        } else {
          break;
        }
      }
    }
  }
  return { lifetimeRestartCount, longestStreak, currentStreak, attemptNumber };
}
