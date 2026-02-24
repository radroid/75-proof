import type { ThemePersonality } from "./themes";

export interface OnboardingHabit {
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

export type SetupTier = "original" | "customized" | "added";

export interface OnboardingState {
  ageRange: string | null;
  healthConditions: string[];
  healthAdvisoryAcknowledged: boolean;
  goals: string[];
  displayName: string;
  timezone: string;
  theme: ThemePersonality;
  setupTier: SetupTier;
  habits: OnboardingHabit[];
  startDate: string;
  visibility: "private" | "friends" | "public";
}

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  ageRange: null,
  healthConditions: [],
  healthAdvisoryAcknowledged: false,
  goals: [],
  displayName: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  theme: "arctic",
  setupTier: "original",
  habits: [],
  startDate: new Date().toISOString().split("T")[0],
  visibility: "friends",
};

export const ONBOARDING_STEPS = [
  "welcome",
  "goals",
  "theme",
  "tier",
  "habits",
  "review",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const AGE_RANGES = [
  "18-24",
  "25-34",
  "35-44",
  "45-54",
  "55+",
] as const;

export const HEALTH_CONDITIONS = [
  "Heart condition",
  "Joint issues",
  "Respiratory condition",
  "Pregnancy",
  "Recent surgery",
  "Other",
] as const;

export const GOAL_OPTIONS = [
  { id: "mental-toughness", label: "Build Mental Toughness", icon: "brain" },
  { id: "fitness", label: "Get in Shape", icon: "dumbbell" },
  { id: "discipline", label: "Build Discipline", icon: "target" },
  { id: "weight-loss", label: "Lose Weight", icon: "trending-down" },
  { id: "reading", label: "Read More", icon: "book-open" },
  { id: "hydration", label: "Stay Hydrated", icon: "droplets" },
  { id: "sobriety", label: "Quit Alcohol", icon: "ban" },
  { id: "consistency", label: "Be More Consistent", icon: "calendar-check" },
] as const;
