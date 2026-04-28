/**
 * Local-mode persistence types. Mirrors the Convex schema for the slice
 * we replicate (users, challenges, habitDefinitions, habitEntries,
 * activityFeed). Friends/feed/push tables are intentionally absent —
 * local mode has no social or push surface.
 *
 * IDs are plain strings prefixed `local_<table>_<n>`. Components consume
 * them via `any`/`string` so the lack of Convex branding is invisible.
 */

export const LOCAL_DB_KEY = "75proof:local:v1";

export interface LocalSharingPrefs {
  showStreak: boolean;
  showDayNumber: boolean;
  showCompletionStatus: boolean;
  showHabits?: boolean;
}

export interface LocalNotificationPrefs {
  enabled: boolean;
  morningReminder: boolean;
  eveningReminder: boolean;
  morningTime: string;
  eveningTime: string;
  /** Set when the user grants browser notification permission in local mode. */
  permissionGrantedAt?: string;
}

export interface LocalUserPreferences {
  timezone: string;
  reminderTime?: string;
  waterUnit: "oz" | "ml";
  sharing?: LocalSharingPrefs;
  notifications?: LocalNotificationPrefs;
}

export interface LocalUserOnboarding {
  completedAt: string;
  ageRange?: string;
  healthConditions?: string[];
  goals?: string[];
  healthAdvisoryAcknowledged: boolean;
  setupTier: "original" | "customized" | "added";
  /** Routine catalog slug picked during onboarding. Optional for legacy users. */
  templateSlug?: string;
}

export interface LocalUser {
  _id: string;
  _creationTime: number;
  clerkId: string;
  displayName: string;
  avatarUrl?: string;
  currentChallengeId?: string;
  lifetimeRestartCount?: number;
  longestStreak?: number;
  preferences: LocalUserPreferences;
  onboardingComplete?: boolean;
  hasSeenTutorial?: boolean;
  onboarding?: LocalUserOnboarding;
}

export interface LocalChallenge {
  _id: string;
  _creationTime: number;
  userId: string;
  startDate: string;
  currentDay: number;
  status: "active" | "completed" | "failed";
  failedOnDay?: number;
  restartCount?: number;
  visibility: "private" | "friends" | "public";
  setupTier?: "original" | "customized" | "added";
  daysTotal?: number;
  isHabitTracker?: boolean;
  templateSlug?: string;
}

export interface LocalHabitDefinition {
  _id: string;
  _creationTime: number;
  challengeId: string;
  userId: string;
  name: string;
  blockType: "task" | "counter";
  target?: number;
  unit?: string;
  isHard: boolean;
  isActive: boolean;
  sortOrder: number;
  category?: string;
  icon?: string;
}

export interface LocalHabitEntry {
  _id: string;
  _creationTime: number;
  habitDefinitionId: string;
  challengeId: string;
  userId: string;
  dayNumber: number;
  date: string;
  completed: boolean;
  value?: number;
}

export interface LocalActivityFeedItem {
  _id: string;
  _creationTime: number;
  userId: string;
  type:
    | "day_completed"
    | "challenge_started"
    | "challenge_completed"
    | "challenge_failed"
    | "milestone";
  challengeId: string;
  dayNumber?: number;
  message: string;
  createdAt: string;
}

export interface LocalDB {
  version: 1;
  user: LocalUser | null;
  challenges: LocalChallenge[];
  habitDefinitions: LocalHabitDefinition[];
  habitEntries: LocalHabitEntry[];
  activityFeed: LocalActivityFeedItem[];
  /** Monotonic counter for ID generation. */
  nextId: number;
}

export function emptyDB(): LocalDB {
  return {
    version: 1,
    user: null,
    challenges: [],
    habitDefinitions: [],
    habitEntries: [],
    activityFeed: [],
    nextId: 1,
  };
}
