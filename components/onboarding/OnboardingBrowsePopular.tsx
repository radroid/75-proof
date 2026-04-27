"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Dumbbell,
  Brain,
  Target,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  POPULAR_ROUTINES_SEED,
  type PopularRoutineSeed,
  type RoutineCategory,
} from "@/convex/lib/popularRoutinesSeed";
import type {
  OnboardingHabit,
  OnboardingState,
} from "@/lib/onboarding-types";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
}

interface CategoryFilter {
  id: RoutineCategory | "all";
  label: string;
  Icon: typeof Dumbbell;
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  { id: "all", label: "All", Icon: Sparkles },
  { id: "fitness", label: "Fitness", Icon: Dumbbell },
  { id: "skill-building", label: "Skills", Icon: Brain },
  { id: "productivity", label: "Productivity", Icon: Target },
  { id: "personal-development", label: "Personal", Icon: HeartHandshake },
];

const CATEGORY_ICONS: Record<RoutineCategory, typeof Dumbbell> = {
  fitness: Dumbbell,
  "skill-building": Brain,
  productivity: Target,
  "personal-development": HeartHandshake,
};

const CATEGORY_LABEL: Record<RoutineCategory, string> = {
  fitness: "Fitness",
  "skill-building": "Skill",
  productivity: "Productivity",
  "personal-development": "Personal",
};

/**
 * Best-effort parse of a freeform duration string ("75 days", "9 weeks (3 runs/week)",
 * "Ongoing daily") into a day count. Returns null when nothing matches — the caller
 * falls back to a safe default and the duration step lets the user adjust.
 */
function parseDurationToDays(raw: string): number | null {
  const dayMatch = raw.match(/(\d+)\s*-?\s*day/i);
  if (dayMatch) {
    const n = Number.parseInt(dayMatch[1], 10);
    if (Number.isFinite(n) && n >= 7 && n <= 365) return n;
  }
  const weekMatch = raw.match(/(\d+)\s*-?\s*week/i);
  if (weekMatch) {
    const weeks = Number.parseInt(weekMatch[1], 10);
    if (Number.isFinite(weeks)) {
      const days = weeks * 7;
      if (days >= 7 && days <= 365) return days;
    }
  }
  return null;
}

/**
 * Derive habit hardness from the routine's tags. The seed catalog tags
 * gentle/beginner-friendly programs (e.g. 75 SOFT, Couch-to-5K, Hot Girl
 * Walk) — we honour those by seeding habits as soft so the user isn't
 * stuck restarting day 1 over a missed walk. Everything else defaults to
 * hard, matching the "miss = restart" 75-HARD ethos most of the catalog
 * targets.
 */
const SOFT_TAGS: ReadonlySet<string> = new Set(["gentle", "beginner-friendly"]);

function deriveIsHard(tags: readonly string[]): boolean {
  return !tags.some((t) => SOFT_TAGS.has(t));
}

export function popularRoutineToOnboardingPatch(
  routine: PopularRoutineSeed,
): Partial<OnboardingState> {
  const days = parseDurationToDays(routine.duration) ?? 30;
  const isHard = deriveIsHard(routine.tags);
  const habits: OnboardingHabit[] = routine.trackingChecklist.map((name, i) => ({
    name,
    blockType: "task",
    isHard,
    isActive: true,
    category: routine.category,
    sortOrder: i + 1,
  }));
  return {
    templateSlug: `popular:${routine.slug}`,
    daysTotal: days,
    habits,
    setupTier: "added",
  };
}

export function OnboardingBrowsePopular({
  state,
  updateState,
  onNext,
  onBack,
}: Props) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<RoutineCategory | "all">(
    "all",
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return POPULAR_ROUTINES_SEED.filter((r) => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (!needle) return true;
      const haystack =
        `${r.title} ${r.summary} ${r.tags.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [query, activeCategory]);

  const selectedSlug = state.templateSlug.startsWith("popular:")
    ? state.templateSlug.slice("popular:".length)
    : null;

  const handlePick = (routine: PopularRoutineSeed) => {
    updateState(popularRoutineToOnboardingPatch(routine));
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Pick a popular routine</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Search the catalog or filter by category. You can fine-tune the habits and
          duration in the next steps.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          placeholder="Search routines, tags, summaries…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search routines"
          className="pl-9 h-11"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_FILTERS.map((c) => {
          const active = activeCategory === c.id;
          const { Icon } = c;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              aria-pressed={active}
              className={cn(
                "inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground tabular-nums">
        {filtered.length} routine{filtered.length === 1 ? "" : "s"}
      </p>

      {/* Cards */}
      <ul className="space-y-3" role="list">
        {filtered.length === 0 && (
          <li className="text-center py-8 text-muted-foreground text-sm">
            No routines match your filters.
          </li>
        )}
        {filtered.map((routine) => {
          const selected = selectedSlug === routine.slug;
          const Icon = CATEGORY_ICONS[routine.category];
          const checklistCount = routine.trackingChecklist.length;
          return (
            <li key={routine.slug}>
              <button
                type="button"
                onClick={() => handlePick(routine)}
                aria-pressed={selected}
                className={cn(
                  "w-full flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-sm active:scale-[0.99] motion-reduce:active:scale-100",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{routine.title}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {CATEGORY_LABEL[routine.category]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {routine.summary}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    {routine.duration} · {checklistCount} habit{checklistCount === 1 ? "" : "s"}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <Button variant="ghost" onClick={onBack} className="gap-1 min-h-[44px]">
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          size="lg"
          disabled={!selectedSlug}
          className="flex-1 sm:flex-initial gap-2 min-h-[48px]"
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
