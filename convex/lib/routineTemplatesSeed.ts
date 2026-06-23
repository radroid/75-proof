/**
 * Convex-side mirror of `lib/routine-templates.ts`. Convex bundles the
 * `convex/` directory independently from `lib/`, so this file duplicates
 * the static seed list rather than importing it. Keep the two in sync.
 */

import { STANDARD_HABITS, type StandardHabit } from "./standardHabits";

export interface RoutineTemplateSeed {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: "discipline" | "wellness" | "fitness" | "mind" | "custom";
  daysTotal: number;
  lockedDuration: boolean;
  isHabitTracker: boolean;
  strictMode: boolean;
  difficulty: "beginner" | "intermediate" | "advanced";
  recommendedGoals: string[];
  source: {
    kind: "official" | "influencer" | "community" | "ai-generated";
    attribution?: string;
    sourceUrl?: string;
  };
  habits: StandardHabit[];
  heroIcon: string;
  popularity?: number;
  version: number;
}

const YOGA_HABITS: StandardHabit[] = [
  {
    name: "Yoga",
    blockType: "task",
    isHard: true,
    category: "fitness",
    icon: "flower-2",
    sortOrder: 1,
  },
  {
    name: "45-min Walk",
    blockType: "task",
    isHard: true,
    category: "fitness",
    icon: "footprints",
    sortOrder: 2,
  },
  {
    name: "Healthy Diet",
    blockType: "task",
    isHard: true,
    category: "nutrition",
    icon: "apple",
    sortOrder: 3,
  },
  {
    name: "15 min Meditation",
    blockType: "task",
    isHard: true,
    category: "mind",
    icon: "brain",
    sortOrder: 4,
  },
];

export const ROUTINE_TEMPLATE_SEEDS: RoutineTemplateSeed[] = [
  {
    // Slug retained as-is for back-compat with existing user data; title
    // and description neutralized as part of the rebrand.
    slug: "original-75-hard",
    title: "75-Day Strict Challenge",
    summary: "A strict 75-day daily challenge — miss one and you restart.",
    description:
      "Show up every day for 75 days. Two 45-minute workouts (one outdoor), follow a diet, drink a gallon of water, read 10 pages, and take a daily progress photo. Miss any one and you start over from Day 1.",
    category: "discipline",
    daysTotal: 75,
    lockedDuration: true,
    isHabitTracker: false,
    strictMode: true,
    difficulty: "advanced",
    recommendedGoals: ["mental-toughness", "discipline", "fitness", "weight-loss"],
    source: { kind: "community" },
    habits: STANDARD_HABITS,
    heroIcon: "shield",
    version: 1,
  },
  {
    slug: "30-day-yoga",
    title: "30-Day Yoga Reset",
    summary: "A gentler month of yoga, walking, and stillness.",
    description:
      "Thirty days of daily yoga, a 45-minute walk, a healthy diet, and 15 minutes of meditation. Strict — miss any one and you restart — but lower-impact and shorter.",
    category: "wellness",
    daysTotal: 30,
    lockedDuration: true,
    isHabitTracker: false,
    strictMode: true,
    difficulty: "beginner",
    recommendedGoals: ["consistency", "discipline", "mental-toughness"],
    source: { kind: "community" },
    habits: YOGA_HABITS,
    heroIcon: "flower-2",
    version: 1,
  },
];
