/**
 * Demo data for the guest/browse experience.
 * Shapes match Convex query return types so themed dashboards work unchanged.
 * IDs use `as any` since they're never sent to the server.
 */

import { addDays } from "@/lib/day-utils";

const DEMO_DAY = 12;

// Compute startDate so "today" = Day 12
function getDemoStartDate(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const todayStr = `${yyyy}-${mm}-${dd}`;
  return addDays(todayStr, -(DEMO_DAY - 1));
}

export const DEMO_START_DATE = getDemoStartDate();

export const DEMO_USER = {
  _id: "demo_user" as any,
  _creationTime: Date.now(),
  clerkId: "demo_clerk",
  displayName: "Guest",
  avatarUrl: undefined,
  currentChallengeId: "demo_challenge" as any,
  preferences: {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    waterUnit: "oz" as const,
    sharing: { showStreak: true, showDayNumber: true, showCompletionStatus: true },
  },
};

export const DEMO_CHALLENGE = {
  _id: "demo_challenge" as any,
  _creationTime: Date.now(),
  userId: "demo_user" as any,
  startDate: DEMO_START_DATE,
  currentDay: DEMO_DAY,
  status: "active" as const,
  visibility: "private" as const,
  attemptNumber: 1,
};

/** Today's partial log — workout 1 done, 64oz water, diet+alcohol done, 10 min reading, no photo */
export const DEMO_DAILY_LOG = {
  _id: "demo_log_12" as any,
  _creationTime: Date.now(),
  challengeId: "demo_challenge" as any,
  userId: "demo_user" as any,
  dayNumber: DEMO_DAY,
  date: addDays(DEMO_START_DATE, DEMO_DAY - 1),
  workout1: { name: "Morning Run", type: "cardio", durationMinutes: 45, isOutdoor: true },
  workout2: null,
  outdoorWorkoutCompleted: true,
  waterIntakeOz: 64,
  dietFollowed: true,
  noAlcohol: true,
  readingMinutes: 10,
  progressPhotoId: null,
  allRequirementsMet: false,
  completedAt: undefined,
};

/** 11 completed past days for Progress page */
export function getDemoChallengeLogs() {
  const logs = [];
  for (let day = 1; day <= 11; day++) {
    logs.push({
      _id: `demo_log_${day}` as any,
      _creationTime: Date.now(),
      challengeId: "demo_challenge" as any,
      userId: "demo_user" as any,
      dayNumber: day,
      date: addDays(DEMO_START_DATE, day - 1),
      workout1: { name: "Morning Run", type: "cardio", durationMinutes: 45, isOutdoor: true },
      workout2: { name: "Weight Training", type: "strength", durationMinutes: 45, isOutdoor: false },
      outdoorWorkoutCompleted: true,
      waterIntakeOz: 128,
      dietFollowed: true,
      noAlcohol: true,
      readingMinutes: 20,
      progressPhotoId: "demo_photo" as any,
      allRequirementsMet: true,
      completedAt: new Date().toISOString(),
    });
  }
  // Add today's partial log
  logs.push(DEMO_DAILY_LOG);
  return logs;
}

export const DEMO_LIFETIME_STATS = {
  attemptNumber: 1,
  totalRestarts: 0,
  longestStreak: 11,
};
