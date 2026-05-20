"use client";

import { Sparkles, Dumbbell, BookOpen, Brain, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Suggestion = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  prompt: string;
  accent: string;
};

const SUGGESTIONS: Suggestion[] = [
  {
    icon: Dumbbell,
    label: "Pick a fitness challenge",
    prompt:
      "I want a daily fitness challenge I can stick to. What should I try?",
    accent: "from-orange-500/15 to-rose-500/5",
  },
  {
    icon: Brain,
    label: "Build a deep-work habit",
    prompt: "Help me build a daily deep-work habit for cognitively demanding work.",
    accent: "from-emerald-500/15 to-teal-500/5",
  },
  {
    icon: BookOpen,
    label: "Learn a new skill",
    prompt:
      "I want to learn a new skill consistently. Suggest a routine to keep me on track.",
    accent: "from-sky-500/15 to-indigo-500/5",
  },
  {
    icon: Sun,
    label: "Design my morning routine",
    prompt:
      "Help me design a science-backed morning routine I'll actually stick to.",
    accent: "from-violet-500/15 to-fuchsia-500/5",
  },
];

export function CoachEmptyState({
  onPick,
  disabled,
  composer,
}: {
  onPick: (prompt: string) => void;
  disabled?: boolean;
  composer?: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-stretch gap-6 px-4 py-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <div className="space-y-2 text-left">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What would you like to figure out today?
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          Pick a prompt below, or write your own.
        </p>
      </div>

      {composer && <div className="w-full">{composer}</div>}

      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s.prompt)}
            className={cn(
              "group relative flex items-start gap-3 overflow-hidden rounded-xl border border-border bg-card p-3 text-left text-sm transition-all",
              "hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              "disabled:opacity-50",
            )}
          >
            <div
              aria-hidden
              className={cn(
                "absolute inset-0 -z-10 bg-gradient-to-br opacity-60",
                s.accent,
              )}
            />
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background/60 text-foreground">
              <s.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-medium leading-tight">{s.label}</p>
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                {s.prompt}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
