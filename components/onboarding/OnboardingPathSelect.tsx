"use client";

import { motion } from "framer-motion";
import { Sliders, Sparkles, LibraryBig, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getTemplateBySlug,
  type RoutineTemplate,
} from "@/lib/routine-templates";
import type { EntryPath, OnboardingState } from "@/lib/onboarding-types";
import { useGuest } from "@/components/guest-provider";

interface Props {
  state: OnboardingState;
  updateState: (partial: Partial<OnboardingState>) => void;
  onNext: () => void;
}

interface PathOption {
  id: Exclude<EntryPath, null>;
  title: string;
  blurb: string;
  bestFor: string;
  Icon: typeof Sliders;
  /** Tone class for the icon tile + the selected ring. */
  accent: string;
  /** Render disabled when local-mode users can't reach this path. */
  guestDisabled?: boolean;
}

const PATH_OPTIONS: PathOption[] = [
  {
    id: "popular",
    title: "Browse popular routines",
    blurb: "Pick from 80+ curated programs — 75 HARD, Couch-to-5K, Atomic Habits, and more.",
    bestFor: "Best when you want a proven plan",
    Icon: LibraryBig,
    accent: "text-sky-600 dark:text-sky-400",
  },
  {
    id: "ai",
    title: "Build with AI",
    blurb: "Tell the coach your goals and constraints — it drafts a routine you can refine.",
    bestFor: "Best when nothing off-the-shelf fits",
    Icon: Sparkles,
    accent: "text-violet-600 dark:text-violet-400",
    guestDisabled: true,
  },
  {
    id: "custom",
    title: "Start from scratch",
    blurb: "Add your own habits, set targets, and pick a duration — full control.",
    bestFor: "Best when you already know what you want",
    Icon: Sliders,
    accent: "text-emerald-600 dark:text-emerald-400",
  },
];

export function OnboardingPathSelect({ state, updateState, onNext }: Props) {
  const { isGuest } = useGuest();

  const handlePick = (option: PathOption) => {
    if (option.guestDisabled && isGuest) return;
    if (option.id === "custom") {
      // Seed the build-your-own habits in the same transition as the path
      // change so the habits step has something to render even if the
      // user never visits the template step.
      const custom: RoutineTemplate = getTemplateBySlug("custom");
      updateState({
        entryPath: "custom",
        templateSlug: custom.slug,
        habits: custom.habits.map((h) => ({ ...h, isActive: true })),
        daysTotal: custom.daysTotal,
        setupTier: "added",
      });
    } else {
      updateState({ entryPath: option.id });
    }
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          How do you want to start?
        </h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Pick the entry point that fits you. You can fine-tune everything before you commit.
        </p>
      </div>

      <div className="space-y-3">
        {PATH_OPTIONS.map((option) => {
          const selected = state.entryPath === option.id;
          const disabled = option.guestDisabled && isGuest;
          const { Icon } = option;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handlePick(option)}
              disabled={disabled}
              aria-pressed={selected}
              aria-describedby={disabled ? `${option.id}-disabled-note` : undefined}
              className={cn(
                "w-full flex items-start gap-4 p-4 sm:p-5 rounded-xl border-2 text-left transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                disabled
                  ? "border-border opacity-60 cursor-not-allowed"
                  : "hover:border-primary/50 hover:shadow-sm active:scale-[0.99] motion-reduce:active:scale-100",
                selected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border"
              )}
            >
              <div
                className={cn(
                  "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-muted",
                  option.accent
                )}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold">{option.title}</p>
                  {disabled && (
                    <span
                      id={`${option.id}-disabled-note`}
                      className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"
                    >
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Sign in to use AI
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {option.blurb}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-2">
                  {option.bestFor}
                </p>
              </div>
              {!disabled && (
                <ChevronRight
                  className={cn(
                    "h-5 w-5 shrink-0 self-center transition-colors",
                    selected ? "text-primary" : "text-muted-foreground/50"
                  )}
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
