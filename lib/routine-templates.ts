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

export const ROUTINE_TEMPLATES: ReadonlyArray<RoutineTemplate> = [
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
  {
    // Open-ended option for users who want to design their own routine
    // from a familiar starting point. The 75 HARD habits seed the list,
    // but `lockedDuration: false` reveals the duration step and
    // `strictMode: false` unlocks habit toggling/adding/removing in
    // OnboardingHabitConfig. setupTier resolves to "added".
    slug: "custom",
    title: "Build your own",
    summary: "Pick the habits, set the duration, decide what counts as hard.",
    description:
      "Start from the 75 HARD habit list, then toggle anything on or off, swap targets, add your own habits, and pick how many days you want to commit to.",
    category: "custom",
    daysTotal: 75,
    lockedDuration: false,
    isHabitTracker: false,
    strictMode: false,
    difficulty: "intermediate",
    recommendedGoals: [],
    source: { kind: "official" },
    habits: STANDARD_HABITS,
    heroIcon: "sliders",
    version: 1,
  },
];

export const DEFAULT_TEMPLATE_SLUG = "original-75-hard";

// Defensive clone: ROUTINE_TEMPLATES is the canonical seed and callers
// frequently reach into nested arrays (e.g. `template.habits.map(...)`).
// Returning the shared reference would let any caller mutation leak into
// every later request in the same process.
function cloneTemplate(template: RoutineTemplate): RoutineTemplate {
  return {
    ...template,
    source: { ...template.source },
    recommendedGoals: [...template.recommendedGoals],
    habits: template.habits.map((h) => ({ ...h })),
  };
}

export function getTemplateBySlug(slug: string | null | undefined): RoutineTemplate {
  const found = slug ? ROUTINE_TEMPLATES.find((t) => t.slug === slug) : undefined;
  const target =
    found ??
    ROUTINE_TEMPLATES.find((t) => t.slug === DEFAULT_TEMPLATE_SLUG) ??
    ROUTINE_TEMPLATES[0];
  if (!target) {
    throw new Error("ROUTINE_TEMPLATES must contain at least one template");
  }
  return cloneTemplate(target);
}

export function isKnownTemplate(slug: string | null | undefined): boolean {
  if (!slug) return false;
  return ROUTINE_TEMPLATES.some((t) => t.slug === slug);
}
