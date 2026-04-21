"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Dumbbell, Apple, BookOpen, Circle, Check } from "lucide-react";

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

  const {
    totalFriendsWithChallenge,
    friendsCompleteToday,
    youCompleteToday,
    youHaveChallenge,
    categories,
  } = pulse;

  const totalWithSelf =
    totalFriendsWithChallenge + (youHaveChallenge ? 1 : 0);
  const completeWithSelf =
    friendsCompleteToday + (youCompleteToday === true ? 1 : 0);
  const pct = totalWithSelf > 0 ? (completeWithSelf / totalWithSelf) * 100 : 0;

  return (
    <Card aria-label="Friends' activity today">
      <CardContent className="py-3 px-4 space-y-2.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-baseline gap-2 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Today
            </span>
            <span className="text-sm">
              <span className="font-semibold tabular-nums">
                {completeWithSelf}
              </span>
              <span className="text-muted-foreground">
                {" "}
                / {totalWithSelf} complete
              </span>
            </span>
          </div>
          {youHaveChallenge && (
            <span
              className={[
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shrink-0",
                youCompleteToday
                  ? "bg-success/10 text-success"
                  : "bg-muted/60 text-muted-foreground",
              ].join(" ")}
              title={
                youCompleteToday
                  ? "You've completed today"
                  : "You haven't completed today yet"
              }
            >
              {youCompleteToday ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Circle className="h-3 w-3" aria-hidden="true" />
              )}
              You
            </span>
          )}
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completeWithSelf} of ${totalWithSelf} complete today`}
        >
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
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
                  <Icon
                    className="h-3 w-3 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="font-medium tabular-nums">
                    {cat.completed}
                  </span>
                  <span className="text-muted-foreground">{cat.label}</span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
