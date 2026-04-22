"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dumbbell,
  Apple,
  BookOpen,
  Circle,
  Check,
  HandHeart,
} from "lucide-react";
import { toast } from "sonner";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  dumbbell: Dumbbell,
  apple: Apple,
  "book-open": BookOpen,
  circle: Circle,
};

export function TodayPulse() {
  const pulse = useQuery(api.todayPulse.getTodayPulse);
  const nudgedIds = useQuery(api.nudges.getRecentNudgedFriendIds);
  const sendNudge = useMutation(api.nudges.sendNudge);
  const [pendingNudge, setPendingNudge] = useState<string | null>(null);

  if (!pulse || pulse.totalFriendsWithChallenge === 0) {
    return null;
  }

  const {
    totalFriendsWithChallenge,
    friendsCompleteToday,
    youCompleteToday,
    youHaveChallenge,
    categories,
    friends,
  } = pulse;

  const totalWithSelf =
    totalFriendsWithChallenge + (youHaveChallenge ? 1 : 0);
  const completeWithSelf =
    friendsCompleteToday + (youCompleteToday === true ? 1 : 0);
  const pct = totalWithSelf > 0 ? (completeWithSelf / totalWithSelf) * 100 : 0;

  const handleNudge = async (friendId: Id<"users">, displayName: string) => {
    const key = String(friendId);
    if (pendingNudge === key) return;
    setPendingNudge(key);
    try {
      await sendNudge({ toUserId: friendId });
      toast.success(`Nudged ${displayName} 👋`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not send nudge";
      toast.error(msg);
    } finally {
      setPendingNudge(null);
    }
  };

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
        {friends.length > 0 && (
          <ul
            className="flex flex-wrap items-center gap-1.5"
            aria-label="Friends today"
          >
            {friends.map((f) => {
              const key = String(f.user._id);
              const done = f.completedToday;
              const alreadyNudged = nudgedIds?.includes(key) ?? false;
              const busy = pendingNudge === key;
              return (
                <li key={key}>
                  {done ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-success/10 text-success pl-0.5 pr-2 py-0.5 text-[11px] font-medium min-h-[36px]"
                      title={`${f.user.displayName} completed today`}
                    >
                      <span className="relative inline-block">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={f.user.avatarUrl}
                            alt={f.user.displayName}
                          />
                          <AvatarFallback className="text-[10px]">
                            {f.user.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          aria-hidden="true"
                          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success flex items-center justify-center ring-2 ring-background"
                        >
                          <Check className="h-2.5 w-2.5 text-white" />
                        </span>
                      </span>
                      <span className="truncate max-w-[4.5rem] sm:max-w-[6rem]">
                        {f.user.displayName}
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleNudge(f.user._id, f.user.displayName)
                      }
                      disabled={alreadyNudged || busy}
                      aria-label={
                        alreadyNudged
                          ? `Already nudged ${f.user.displayName}`
                          : `Nudge ${f.user.displayName} — not done today`
                      }
                      title={
                        alreadyNudged
                          ? `Already nudged ${f.user.displayName}`
                          : `Nudge ${f.user.displayName}`
                      }
                      className={[
                        "inline-flex items-center gap-1 rounded-full pl-0.5 pr-2 py-0.5 text-[11px] font-medium min-h-[36px] touch-manipulation transition-all duration-150 active:scale-95 disabled:active:scale-100",
                        alreadyNudged
                          ? "bg-primary/10 text-primary"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                      ].join(" ")}
                    >
                      <span className="relative inline-block">
                        <Avatar className="h-6 w-6 opacity-80">
                          <AvatarImage
                            src={f.user.avatarUrl}
                            alt={f.user.displayName}
                          />
                          <AvatarFallback className="text-[10px]">
                            {f.user.displayName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          aria-hidden="true"
                          className={[
                            "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ring-2 ring-background",
                            alreadyNudged
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          ].join(" ")}
                        >
                          <HandHeart className="h-2.5 w-2.5" />
                        </span>
                      </span>
                      <span className="truncate max-w-[4.5rem] sm:max-w-[6rem]">
                        {alreadyNudged ? "Nudged" : "Nudge"}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
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
