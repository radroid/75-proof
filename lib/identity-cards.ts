/**
 * Static identity-card template library.
 *
 * Per Progress dashboard research §5: copy is data, not LLM-generated. Cheap,
 * deterministic, easy to A/B. v1 ships formation-stage templates only (days
 * 1–30) — consolidation/maintenance tiers are deferred (PD-4, PD-5) until
 * cohorts age into them.
 *
 * Templates render the underlying number alongside the narrative copy at the
 * call site (research §6 a11y), so this module's only job is picking *which*
 * sentence to show.
 */

import type { SocialCategory } from "@/lib/routine-category";

export interface IdentityCardInput {
  /** 1-based day number on the active challenge. */
  currentDay: number;
  /** Total days in the challenge, or null for habit-tracker mode. */
  daysTotal: number | null;
  /** Routine display label, e.g. "75 HARD" or "30-Day Yoga". */
  routineLabel: string;
  /** Social-intensity category — used to bias which copy buckets are eligible. */
  category: SocialCategory;
  /** Highest-rate habit's name + its current consecutive-day streak. Null when unavailable. */
  topHabit: { name: string; streak: number } | null;
  /** Stable per-user salt so two users on the same day don't see the same line. */
  userSalt: string;
}

interface Template {
  /** Higher = more specific; ties broken by day fit. */
  weight: number;
  match: (input: IdentityCardInput) => boolean;
  render: (input: IdentityCardInput) => string;
}

/** Pluralize "day" / "time" so Day 1 doesn't read "1 days in." */
function days(n: number): string {
  return `${n} day${n === 1 ? "" : "s"}`;
}
function times(n: number): string {
  return `${n} time${n === 1 ? "" : "s"}`;
}

// All templates target the formation stage (days 1–30) per research §5
// "v1 template library."
const TEMPLATES: Template[] = [
  // ── Days 1–7 ──────────────────────────────────────────────────
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 1 && currentDay <= 7,
    render: ({ currentDay }) =>
      `You showed up. That's the whole game on Day ${currentDay}.`,
  },
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 1 && currentDay <= 7,
    render: ({ currentDay }) =>
      `${days(currentDay)} in. The hardest part is convincing yourself it's possible — you just did.`,
  },
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 3 && currentDay <= 7,
    render: () => `Most people quit before Day 7. You're not most people.`,
  },

  // ── Days 7–14 ─────────────────────────────────────────────────
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 7 && currentDay <= 14,
    render: ({ currentDay }) =>
      `You're making it past the hardest part. ${days(currentDay)} down.`,
  },
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 14 && currentDay < 21,
    render: () => `Two weeks of evidence: you're someone who shows up.`,
  },
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 7 && currentDay <= 14,
    render: ({ currentDay }) =>
      `You've already done this ${times(currentDay)}. That's the proof.`,
  },

  // ── Days 14–30, with a strong habit ──────────────────────────
  {
    weight: 3,
    match: ({ currentDay, topHabit }) =>
      currentDay >= 14 && currentDay <= 30 && !!topHabit && topHabit.streak >= 3,
    render: ({ topHabit }) =>
      `You did ${topHabit!.name} ${days(topHabit!.streak)} in a row. That's not a streak — that's a pattern.`,
  },
  {
    weight: 2,
    match: ({ currentDay, topHabit }) =>
      currentDay >= 14 && currentDay <= 30 && !!topHabit && topHabit.streak >= 5,
    render: ({ topHabit }) =>
      `${topHabit!.name} is starting to look like who you are.`,
  },

  // ── Fixed-length, all stages ─────────────────────────────────
  {
    weight: 2,
    match: ({ daysTotal, currentDay }) =>
      daysTotal !== null && currentDay <= 30 && daysTotal <= 365,
    render: ({ currentDay, daysTotal }) =>
      `${currentDay} of ${daysTotal}. The version of you on Day ${daysTotal} is waiting.`,
  },

  // ── Days 21–30 (closing formation window) ────────────────────
  {
    weight: 1,
    match: ({ currentDay }) => currentDay >= 21 && currentDay <= 30,
    render: ({ currentDay }) =>
      `Three weeks of practice. Day ${currentDay} is muscle memory in the making.`,
  },
];

/**
 * Returns the underlying number annotation that always renders next to the
 * narrative copy ("This week, 5 of 7 days · 71%"). Pulled out so it can be
 * tested independently and so the card is informative even when copy is muted.
 */
export function weeklyAnnotation(rolling7CompleteDays: number): string {
  const pct = Math.round((rolling7CompleteDays / 7) * 100);
  return `This week, ${rolling7CompleteDays} of 7 days · ${pct}%`;
}

/**
 * Cheap deterministic "hash" of a string → integer. Used so the same user on
 * the same day picks the same template, but two users on the same day pick
 * differently. Not cryptographic — just FNV-1a 32-bit.
 */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Picks an identity-card sentence for the given input. Determinism: same
 * input → same output across the same calendar week (so a user doesn't see
 * the line shuffle on every refresh). Falls back to a never-blank sentinel
 * if no template matches the user's current state.
 */
export function pickIdentityTemplate(input: IdentityCardInput): string {
  const eligible = TEMPLATES.filter((t) => t.match(input));
  if (eligible.length === 0) {
    return `Day ${input.currentDay} of your ${input.routineLabel}.`;
  }

  // Weighted pick. Use a per-week salt so the line stays stable for 7 days
  // before rotating, mirroring research §5's "rotation" guidance without
  // localStorage state. Bucket on the 0-based day index so the rotation
  // crosses on Day 8 (after seven full days), not on Day 7 itself —
  // `floor(currentDay / 7)` would flip mid-week one boundary too early.
  const dayIndex = Math.max(0, input.currentDay - 1);
  const weekSalt = Math.floor(dayIndex / 7);
  const seed = hash(`${input.userSalt}::${weekSalt}`);
  const totalWeight = eligible.reduce((acc, t) => acc + t.weight, 0);
  let target = seed % totalWeight;
  for (const t of eligible) {
    target -= t.weight;
    if (target < 0) return t.render(input);
  }
  return eligible[0].render(input);
}
