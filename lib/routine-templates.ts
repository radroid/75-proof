import { STANDARD_HABITS, type StandardHabit } from "@/convex/lib/standardHabits";

export type RoutineCategory =
  | "discipline"
  | "wellness"
  | "fitness"
  | "mind"
  | "custom";

export type RoutineDifficulty = "beginner" | "intermediate" | "advanced";

export interface RoutineSource {
  kind: "official" | "influencer" | "community" | "ai-generated";
  attribution?: string;
  sourceUrl?: string;
}

export interface RoutineTemplate {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: RoutineCategory;
  daysTotal: number;
  lockedDuration: boolean;
  isHabitTracker: boolean;
  /** strictMode === true → maps to setupTier "original" (miss = restart). */
  strictMode: boolean;
  difficulty: RoutineDifficulty;
  recommendedGoals: string[];
  source: RoutineSource;
  habits: StandardHabit[];
  /** Lucide icon name. */
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

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    slug: "original-75-hard",
    title: "Original 75 HARD",
    summary: "The classic mental-toughness program, exactly as designed.",
    description:
      "Andy Frisella's 75 HARD: two 45-minute workouts (one outdoor), follow a diet, no alcohol, drink a gallon of water, read 10 pages, and take a daily progress photo. Miss any one and you start over from Day 1.",
    category: "discipline",
    daysTotal: 75,
    lockedDuration: true,
    isHabitTracker: false,
    strictMode: true,
    difficulty: "advanced",
    recommendedGoals: ["mental-toughness", "discipline", "fitness", "weight-loss"],
    source: {
      kind: "official",
      attribution: "Andy Frisella",
      sourceUrl: "https://andyfrisella.com/pages/75hard-info",
    },
    habits: STANDARD_HABITS,
    heroIcon: "shield",
    version: 1,
  },
  {
    slug: "30-day-yoga",
    title: "30-Day Yoga Reset",
    summary: "A gentler month of yoga, walking, and stillness.",
    description:
      "Thirty days of daily yoga, a 45-minute walk, a healthy diet, and 15 minutes of meditation. Strict like 75 HARD — miss any one and you restart — but lower-impact and shorter.",
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

export const DEFAULT_TEMPLATE_SLUG = "original-75-hard";

export function getTemplateBySlug(slug: string | null | undefined): RoutineTemplate {
  const found = slug ? ROUTINE_TEMPLATES.find((t) => t.slug === slug) : undefined;
  if (found) return found;
  const defaultTemplate = ROUTINE_TEMPLATES.find(
    (t) => t.slug === DEFAULT_TEMPLATE_SLUG,
  );
  return defaultTemplate ?? ROUTINE_TEMPLATES[0];
}

export function isKnownTemplate(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return ROUTINE_TEMPLATES.some((t) => t.slug === slug);
}
