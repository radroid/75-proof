"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Apple, BookOpen, Circle } from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  apple: Apple,
  "book-open": BookOpen,
  circle: Circle,
};

export function TodayPulse() {
  const pulse = useQuery(api.todayPulse.getTodayPulse);

  if (!pulse || pulse.totalFriendsWithChallenge === 0) {
    return null;
  }

  const { totalFriendsWithChallenge, friendsCompleteToday, categories } = pulse;

  return (
    <Card aria-label="Friends' activity today">
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today
            </span>
            <span className="text-sm">
              <span className="font-semibold tabular-nums">
                {friendsCompleteToday}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {totalFriendsWithChallenge} complete
              </span>
            </span>
          </div>
          {categories.length > 0 && (
            <ul className="flex items-center gap-2 flex-wrap">
              {categories.map((cat) => {
                const Icon = ICONS[cat.icon] ?? Circle;
                return (
                  <li
                    key={cat.category}
                    className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-xs"
                    title={`${cat.completed} friend${cat.completed === 1 ? "" : "s"} did ${cat.label.toLowerCase()} today`}
                  >
                    <Icon className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                    <span className="font-medium tabular-nums">
                      {cat.completed}
                    </span>
                    <span className="text-muted-foreground">
                      {cat.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
