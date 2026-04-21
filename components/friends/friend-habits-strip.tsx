"use client";

import {
  Dumbbell,
  Sun,
  Droplets,
  Apple,
  Ban,
  BookOpen,
  Camera,
  CircleDot,
  Hash,
  Check,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  sun: Sun,
  droplets: Droplets,
  apple: Apple,
  ban: Ban,
  "book-open": BookOpen,
  camera: Camera,
  "circle-dot": CircleDot,
  hash: Hash,
};

export type FriendHabit = {
  _id: string;
  name: string;
  icon?: string;
  category?: string;
  isHard: boolean;
  completedToday: boolean | null;
};

export function FriendHabitsStrip({ habits }: { habits: FriendHabit[] }) {
  if (habits.length === 0) return null;

  return (
    <ul
      className="mt-3 flex flex-wrap items-center gap-1"
      aria-label="Habits tracked"
    >
      {habits.map((habit) => {
        const Icon = habit.icon ? ICONS[habit.icon] : undefined;
        const done = habit.completedToday === true;
        return (
          <li
            key={habit._id}
            className={[
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-none min-h-[22px] max-w-full",
              done
                ? "bg-success/15 text-success"
                : habit.completedToday === null
                ? "bg-muted/60 text-muted-foreground"
                : "bg-muted/60 text-muted-foreground",
            ].join(" ")}
            title={
              habit.completedToday === true
                ? `${habit.name} — done today`
                : habit.completedToday === false
                ? `${habit.name} — not yet today`
                : habit.name
            }
          >
            {done ? (
              <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
            ) : Icon ? (
              <Icon className="h-3 w-3 shrink-0" />
            ) : habit.isHard ? (
              <CircleDot className="h-3 w-3 shrink-0" aria-hidden="true" />
            ) : (
              <Hash className="h-3 w-3 shrink-0" aria-hidden="true" />
            )}
            <span className="truncate max-w-[10rem]">{habit.name}</span>
          </li>
        );
      })}
    </ul>
  );
}
