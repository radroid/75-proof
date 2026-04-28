"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/layout/page-container";
import { MotionList, MotionListItem } from "@/components/ui/motion";
import { StatSkeleton, HeroSkeleton } from "@/components/ui/skeleton-enhanced";
import { EmptyState } from "@/components/ui/empty-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Filter,
  Trophy,
  Play,
  XCircle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useGuest } from "@/components/guest-provider";
import {
  effectiveDaysTotal,
  formatEndDate,
  describeChallengePhase,
  getTodayInTimezone,
  getUserTimezone,
} from "@/lib/day-utils";
import { ChallengeUpcoming } from "@/components/challenge-upcoming";
import {
  useLocalActiveChallenge,
  useLocalUserChallenges,
  useLocalHabitDefinitions,
  useLocalAllEntriesForChallenge,
  useLocalDayCompletionMap,
} from "@/lib/local-store/hooks";
import {
  rollingCompletionRate,
  effortRollingRate,
  currentStreakFrom,
  perHabitStats,
  type HabitDefView,
  type HabitEntryView,
} from "@/lib/progress-metrics";
import { resolveSocialCategory } from "@/lib/routine-category";
import { IdentityCard } from "@/components/progress/identity-card";
import { HeadlineMetrics } from "@/components/progress/headline-metrics";
import { TodaySnapshot } from "@/components/progress/today-snapshot";
import { CalendarGrid } from "@/components/progress/calendar-grid";
import { HabitHeatmap } from "@/components/progress/habit-heatmap";
import { PerHabitList } from "@/components/progress/per-habit-list";
import { FriendsRibbon } from "@/components/progress/friends-ribbon";
import { ActivityFeed } from "@/components/friends/activity-feed";
import {
  getTemplateBySlug,
  isKnownTemplate,
} from "@/lib/routine-templates";
import posthog from "posthog-js";

type FilterType = "all" | "complete" | "incomplete";

const ROLLING_WINDOW = 30;
const HEATMAP_MIN_DAYS = 90;

// Local view types — kept here because they cover both the Convex `Doc<>`
// shapes and the `LocalDB` shapes the guest hooks return. Importing the
// generated Convex types would force-narrow away the local-mode rows. These
// pick only the fields this page actually reads.
type UserView = {
  _id?: string;
  clerkId?: string;
  displayName?: string;
  avatarUrl?: string;
  identityStatement?: string | null;
};

type HistoryEntryView = {
  habitDefinitionId: string;
  dayNumber: number;
  date?: string;
  completed?: boolean;
  value?: number;
};

type ChallengeRowView = {
  _id: string;
  status: "active" | "completed" | "failed";
  currentDay: number;
  startDate: string;
  daysTotal?: number;
  isHabitTracker?: boolean;
  failedOnDay?: number;
  templateSlug?: string;
};

type FeedItemView = {
  _id: string;
  type:
    | "day_completed"
    | "challenge_started"
    | "challenge_completed"
    | "challenge_failed"
    | "milestone";
  message: string;
  createdAt: string;
  dayNumber?: number;
  backfilled?: boolean;
  // ActivityFeed's prop accepts `null` but not `undefined`. Personal-feed
  // rows from Convex don't carry a `user`; we always attach one before
  // passing in, so this stays `... | null` (never undefined).
  user: { displayName: string; avatarUrl?: string } | null;
};

type LegacyDayLog = {
  dayNumber: number;
  date?: string;
  completedAt?: string;
  backfilled?: boolean;
  workout1?: { name: string; durationMinutes: number };
  workout2?: { name: string; durationMinutes: number };
  outdoorWorkoutCompleted: boolean;
  waterIntakeOz: number;
  readingMinutes: number;
  dietFollowed: boolean;
  noAlcohol: boolean;
  progressPhotoId?: string;
};

export default function ProgressPage() {
  const { isGuest, demoUser, demoLifetimeStats } = useGuest();

  const convexUser = useQuery(api.users.getCurrentUser, isGuest ? "skip" : undefined);
  const user = isGuest ? demoUser : convexUser;
  const convexChallenges = useQuery(
    api.challenges.getUserChallenges,
    isGuest ? "skip" : (convexUser ? { userId: convexUser._id } : "skip"),
  );
  const localChallenges = useLocalUserChallenges();
  const challenges = isGuest ? localChallenges : convexChallenges;
  const convexChallenge = useQuery(
    api.challenges.getChallenge,
    isGuest
      ? "skip"
      : convexUser?.currentChallengeId
        ? { challengeId: convexUser.currentChallengeId }
        : "skip",
  );
  const localChallenge = useLocalActiveChallenge();
  const challenge = isGuest ? localChallenge : convexChallenge;

  const convexLifetimeStats = useQuery(
    api.challenges.getLifetimeStats,
    isGuest ? "skip" : convexUser ? { userId: convexUser._id } : "skip",
  );
  const lifetimeStats = isGuest ? demoLifetimeStats : convexLifetimeStats;

  const convexActiveCompletionMap = useQuery(
    api.challenges.getDayCompletionMap,
    isGuest
      ? "skip"
      : convexUser?.currentChallengeId
        ? { challengeId: convexUser.currentChallengeId }
        : "skip",
  );
  const localActiveCompletionMap = useLocalDayCompletionMap(
    isGuest ? localChallenge?._id : undefined,
  );
  const activeCompletionMap: Record<number, boolean> = isGuest
    ? (localActiveCompletionMap ?? {})
    : (convexActiveCompletionMap ?? {});

  const convexActiveHabitDefs = useQuery(
    api.habitDefinitions.getHabitDefinitions,
    isGuest
      ? "skip"
      : convexUser?.currentChallengeId
        ? { challengeId: convexUser.currentChallengeId }
        : "skip",
  );
  const localActiveHabitDefs = useLocalHabitDefinitions(
    isGuest ? localChallenge?._id : undefined,
  );
  const activeHabitDefs: HabitDefView[] | undefined = (isGuest
    ? localActiveHabitDefs
    : convexActiveHabitDefs) as HabitDefView[] | undefined;

  const convexActiveHabitEntries = useQuery(
    api.habitEntries.getAllEntriesForChallenge,
    isGuest
      ? "skip"
      : convexUser?.currentChallengeId
        ? { challengeId: convexUser.currentChallengeId }
        : "skip",
  );
  const localActiveHabitEntries = useLocalAllEntriesForChallenge(
    isGuest ? localChallenge?._id : undefined,
  );
  const activeHabitEntries: HabitEntryView[] | undefined = (isGuest
    ? localActiveHabitEntries
    : convexActiveHabitEntries) as HabitEntryView[] | undefined;

  // Activity feed (Phase 2 of Friends merge — Tab on Progress). Merges the
  // user's own activity in with the friends feed so reactions on their own
  // posts ("2 cheers on your Day 7 milestone") show up alongside friends'
  // updates. Server queries stay split because `getPersonalFeed` doesn't
  // join the user record (it's the same user every row) and `getFriendsFeed`
  // already filters by visibility + blocks.
  const friendsFeed = useQuery(
    api.feed.getFriendsFeed,
    isGuest ? "skip" : undefined,
  );
  const personalFeedRaw = useQuery(
    api.feed.getPersonalFeed,
    isGuest ? "skip" : undefined,
  );

  // Legacy dailyLogs — kept for the day-by-day history's polymorphic
  // legacy/new-system rendering. Not used elsewhere.
  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest
      ? "skip"
      : convexUser?.currentChallengeId
        ? { challengeId: convexUser.currentChallengeId }
        : "skip",
  );

  // History selector state
  const [selectedChallengeId, setSelectedChallengeId] =
    useState<Id<"challenges"> | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"stats" | "activity">("stats");

  const activeChallenge = challenges?.find((c) => c.status === "active");
  const effectiveHistoryId = isGuest
    ? localChallenge?._id
    : (selectedChallengeId ?? activeChallenge?._id ?? challenges?.[0]?._id);

  const historyLogs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ||
      !effectiveHistoryId ||
      effectiveHistoryId === convexUser?.currentChallengeId
      ? "skip"
      : { challengeId: effectiveHistoryId as Id<"challenges"> },
  );
  const historyCompletionMap = useQuery(
    api.challenges.getDayCompletionMap,
    isGuest ||
      !effectiveHistoryId ||
      effectiveHistoryId === convexUser?.currentChallengeId
      ? "skip"
      : { challengeId: effectiveHistoryId as Id<"challenges"> },
  );
  const historyHabitDefs = useQuery(
    api.habitDefinitions.getHabitDefinitions,
    isGuest ||
      !effectiveHistoryId ||
      effectiveHistoryId === convexUser?.currentChallengeId
      ? "skip"
      : { challengeId: effectiveHistoryId as Id<"challenges"> },
  );
  const historyHabitEntries = useQuery(
    api.habitEntries.getAllEntriesForChallenge,
    isGuest ||
      !effectiveHistoryId ||
      effectiveHistoryId === convexUser?.currentChallengeId
      ? "skip"
      : { challengeId: effectiveHistoryId as Id<"challenges"> },
  );

  const selectedHistoryChallenge = isGuest
    ? localChallenge
    : challenges?.find((c) => c._id === effectiveHistoryId);
  const effectiveHistoryLogs = isGuest
    ? []
    : effectiveHistoryId === convexUser?.currentChallengeId
      ? logs
      : historyLogs;
  const effectiveHistoryCompletionMap: Record<number, boolean> = isGuest
    ? (localActiveCompletionMap ?? {})
    : effectiveHistoryId === convexUser?.currentChallengeId
      ? activeCompletionMap
      : (historyCompletionMap ?? {});
  const effectiveHistoryHabitDefs = isGuest
    ? localActiveHabitDefs
    : effectiveHistoryId === convexUser?.currentChallengeId
      ? activeHabitDefs
      : historyHabitDefs;
  const effectiveHistoryHabitEntries = isGuest
    ? localActiveHabitEntries
    : effectiveHistoryId === convexUser?.currentChallengeId
      ? activeHabitEntries
      : historyHabitEntries;
  const isHistoryNewSystem =
    isGuest ||
    (!!effectiveHistoryHabitDefs && effectiveHistoryHabitDefs.length > 0);

  const loggedDaysMap = new Map(
    effectiveHistoryLogs?.map((log) => [log.dayNumber, log]),
  );
  const historyEntriesByDay = new Map<number, HistoryEntryView[]>();
  for (const e of (effectiveHistoryHabitEntries ?? []) as HistoryEntryView[]) {
    const list = historyEntriesByDay.get(e.dayNumber) ?? [];
    list.push(e);
    historyEntriesByDay.set(e.dayNumber, list);
  }
  const sortedHabitDefs: HabitDefView[] = effectiveHistoryHabitDefs
    ? [...(effectiveHistoryHabitDefs as HabitDefView[])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      )
    : [];
  const allDays = selectedHistoryChallenge
    ? Array.from(
        { length: selectedHistoryChallenge.currentDay },
        (_, i) => i + 1,
      ).reverse()
    : [];
  const filteredDays = allDays.filter((day) => {
    const isComplete = !!effectiveHistoryCompletionMap[day];
    if (filter === "complete") return isComplete;
    if (filter === "incomplete") return !isComplete;
    return true;
  });

  const toggleExpanded = (day: number) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(day)) newSet.delete(day);
    else newSet.add(day);
    setExpandedDays(newSet);
  };

  // ── Derivations for the new IA ──────────────────────────────
  const activeDaysTotal = challenge ? effectiveDaysTotal(challenge) : null;
  const isActiveHabitTracker = activeDaysTotal === null;
  const currentDay = challenge?.currentDay ?? 0;

  // Headline rate: effort-based (research §2.2). Averages per-day per-habit
  // completion (`min(value/target, 1)` for counters, 0/1 for tasks). Falls
  // back to the binary completion-map rate when the user is on the legacy
  // dailyLogs schema (no habitDefinitions yet) so the tile isn't blank.
  const effort30 = useMemo(
    () =>
      activeHabitDefs && activeHabitEntries
        ? effortRollingRate(
            activeHabitDefs,
            activeHabitEntries,
            currentDay,
            ROLLING_WINDOW,
          )
        : { rate: null, consideredDays: 0 },
    [activeHabitDefs, activeHabitEntries, currentDay],
  );
  const binary30 = useMemo(
    () => rollingCompletionRate(activeCompletionMap, currentDay, ROLLING_WINDOW),
    [activeCompletionMap, currentDay],
  );
  const rolling30 = effort30.rate !== null ? effort30 : binary30;

  const rolling7 = useMemo(
    () => rollingCompletionRate(activeCompletionMap, currentDay, 7),
    [activeCompletionMap, currentDay],
  );
  const currentStreak = useMemo(
    () => currentStreakFrom(activeCompletionMap, currentDay),
    [activeCompletionMap, currentDay],
  );

  const habitStats = useMemo(
    () =>
      activeHabitDefs && activeHabitEntries
        ? perHabitStats(
            activeHabitDefs,
            activeHabitEntries,
            currentDay,
            ROLLING_WINDOW,
          )
        : [],
    [activeHabitDefs, activeHabitEntries, currentDay],
  );

  const topHabit = useMemo(() => {
    if (habitStats.length === 0) return null;
    const sorted = [...habitStats].sort((a, b) => b.streak - a.streak);
    return sorted[0].streak >= 3
      ? { name: sorted[0].name, streak: sorted[0].streak }
      : null;
  }, [habitStats]);

  // Today snapshot: count active hard habits done today via the completion
  // map's source-of-truth derivation. We also count *all* active habits done
  // for the "X of N" display so it reflects the user's full routine, not
  // just the gating subset.
  const todayStats = useMemo(() => {
    if (currentDay < 1) return { done: 0, total: 0 };
    // New-system path: per-habit entries.
    if (activeHabitDefs && activeHabitEntries && activeHabitDefs.length > 0) {
      const todayEntries = activeHabitEntries.filter(
        (e) => e.dayNumber === currentDay,
      );
      const entriesByHabit = new Map(
        todayEntries.map((e) => [e.habitDefinitionId, e]),
      );
      const active = activeHabitDefs.filter((h) => h.isActive);
      let done = 0;
      for (const h of active) {
        const e = entriesByHabit.get(h._id);
        if (h.blockType === "counter") {
          if (e?.completed || (e?.value ?? 0) >= (h.target ?? Infinity)) done += 1;
        } else if (e?.completed) {
          done += 1;
        }
      }
      return { done, total: active.length };
    }
    // Legacy 75-Hard path: derive done/total from the `dailyLogs` row for
    // the current day. The seven canonical hard requirements plus an
    // optional progress photo (Counted in `total` only when the user has
    // actually uploaded one — older 75 HARD instructions were ambiguous on
    // whether the photo gates completion). This keeps the snapshot honest
    // for the cohort still on the legacy schema.
    const todayLog = (logs ?? []).find((l) => l.dayNumber === currentDay) as
      | LegacyDayLog
      | undefined;
    if (!todayLog) return { done: 0, total: 7 };
    const reqs: boolean[] = [
      !!todayLog.workout1 && todayLog.workout1.durationMinutes >= 45,
      !!todayLog.workout2 && todayLog.workout2.durationMinutes >= 45,
      !!todayLog.outdoorWorkoutCompleted,
      todayLog.waterIntakeOz >= 128,
      todayLog.readingMinutes >= 20,
      !!todayLog.dietFollowed,
      !!todayLog.noAlcohol,
    ];
    return {
      done: reqs.filter(Boolean).length,
      total: reqs.length,
    };
  }, [activeHabitDefs, activeHabitEntries, currentDay, logs]);

  const routineLabel = useMemo(() => {
    const slug = challenge?.templateSlug;
    if (slug && isKnownTemplate(slug)) return getTemplateBySlug(slug).title;
    if (slug?.startsWith("ai-generated:")) return "your routine";
    if (slug?.startsWith("popular:")) return "your routine";
    return isActiveHabitTracker ? "habit tracker" : "your challenge";
  }, [challenge?.templateSlug, isActiveHabitTracker]);

  const socialCategory = useMemo(
    () => resolveSocialCategory(challenge?.templateSlug),
    [challenge?.templateSlug],
  );

  // Salt the identity card pick by user id so two users on the same day see
  // different lines, but the same user sees a stable line within a week.
  const userView = user as UserView | null | undefined;
  const userSalt = userView?._id ?? userView?.clerkId ?? "anon";

  // Page-view event. Fire once per mount, after we have the user + challenge.
  // `currentDay` is intentionally NOT in the deps — including it would re-fire
  // the event every time the user logs a habit and advances the day. The ref
  // guard makes the "fire once" promise hold even if React Strict Mode
  // double-invokes the effect.
  const pageViewSentRef = useRef(false);
  useEffect(() => {
    if (pageViewSentRef.current) return;
    if (!user || !challenge) return;
    pageViewSentRef.current = true;
    posthog.capture("progress_page_view", {
      is_habit_tracker: isActiveHabitTracker,
      current_day: currentDay,
      template_slug: challenge.templateSlug ?? null,
      local_mode: isGuest,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, challenge, isActiveHabitTracker, isGuest]);

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value as "stats" | "activity");
    posthog.capture("progress_tab_switched", { tab: value });
  }, []);

  const handleLogTap = useCallback(() => {
    posthog.capture("progress_to_log_tap");
  }, []);

  const handleRibbonImpression = useCallback(() => {
    posthog.capture("progress_friends_ribbon_view");
  }, []);

  // Merged activity feed: user's own activity items shaped to match the
  // friends-feed item type, then concatenated and sorted desc by createdAt.
  // `getPersonalFeed` rows don't carry a `user` object, so we attach one
  // from the current user record. Backfilled rows are filtered to match
  // `getFriendsFeed`'s contract (those are reconciliation artifacts, not
  // moments worth surfacing in the feed).
  const mergedActivityFeed = useMemo<FeedItemView[] | undefined>(() => {
    if (friendsFeed === undefined && personalFeedRaw === undefined)
      return undefined;
    const friendItems = (friendsFeed ?? []) as FeedItemView[];
    // Personal-feed rows are raw `Doc<"activityFeed">` shapes (no `user` join).
    // Cast through unknown because we're explicitly attaching `user` below.
    type PersonalRaw = Omit<FeedItemView, "user">;
    const rawPersonal = (personalFeedRaw ?? []) as unknown as PersonalRaw[];
    const myItems: FeedItemView[] = rawPersonal
      .filter((a) => !a.backfilled)
      .map((a) => ({
        ...a,
        user: {
          displayName: userView?.displayName ?? "You",
          avatarUrl: userView?.avatarUrl,
        },
      }));
    return [...friendItems, ...myItems].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0,
    );
  }, [friendsFeed, personalFeedRaw, userView]);

  // ── Loading / empty ────────────────────────────────────────
  // Distinguish loading (`undefined`) from "no active challenge" (`null`):
  // Convex's `useQuery` returns `undefined` while in flight, and the empty
  // state firing during slow loads makes the page flash through "Start a
  // challenge" before the data lands.
  const isUserLoading = !isGuest && user === undefined;
  const isChallengeLoading = !isGuest && convexUser?.currentChallengeId
    ? convexChallenge === undefined
    : false;
  if (isUserLoading || isChallengeLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
          <div className="h-5 w-64 mt-2 rounded-md bg-muted animate-pulse" />
        </div>
        <HeroSkeleton />
        <div className="grid gap-4 grid-cols-2">
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    );
  }

  if (!user || !challenge) {
    return (
      <PageContainer>
        <h1
          className="text-4xl md:text-5xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Progress
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">
          Start a challenge to see your progress here.
        </p>
      </PageContainer>
    );
  }

  // Future-start: render the upcoming-challenge placeholder rather than
  // stat sections that would all be empty pre-Day-1.
  const todayStr = getTodayInTimezone(getUserTimezone());
  const phase = describeChallengePhase(challenge.startDate, todayStr);
  if (phase.kind === "future") {
    return (
      <ChallengeUpcoming
        startDate={challenge.startDate}
        phase={phase}
        routineLabel={routineLabel}
      />
    );
  }

  // The future-start branch above catches every `currentDay < 1` case, so
  // by here `currentDay >= 1` and the stat sections always have something
  // to render. Habit-tracker bounded fallback uses a 30-cell minimum so
  // the grid isn't mostly empty for users with <23 days of history
  // (research §3.4 — "fall back to a bounded grid sized to the user's
  // history").
  const calendarLength = isActiveHabitTracker
    ? Math.max(currentDay + 7, 30)
    : (activeDaysTotal ?? 75);
  const useHeatmap = isActiveHabitTracker && currentDay >= HEATMAP_MIN_DAYS;

  return (
    <PageContainer>
      <div className="mb-8 md:mb-12">
        <h1
          className="text-3xl md:text-5xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Progress
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">
          {isActiveHabitTracker
            ? "Habit tracker — no end date"
            : `Ends on ${formatEndDate(challenge.startDate, activeDaysTotal ?? 75)}`}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="w-full sm:max-w-sm h-11 sm:h-9 mb-6 md:mb-10">
          <TabsTrigger value="stats" className="flex-1">
            Stats
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1">
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-8 md:space-y-12">
          {/* Identity card — hero */}
          <IdentityCard
            userStatement={userView?.identityStatement ?? null}
            rolling7CompleteDays={rolling7.completedDays}
            templateInput={{
              currentDay,
              daysTotal: activeDaysTotal,
              routineLabel,
              category: socialCategory,
              topHabit,
              userSalt: String(userSalt),
            }}
          />

          {/* Today snapshot — read-only with Log → */}
          <TodaySnapshot
            habitsCompleted={todayStats.done}
            habitsTotal={todayStats.total}
            isDayComplete={!!activeCompletionMap[currentDay]}
            onLogTap={handleLogTap}
          />

          {/* Headline metrics — 30-day rate + streak chip */}
          {(
            <HeadlineMetrics
              rate={rolling30.rate}
              consideredDays={rolling30.consideredDays}
              windowDays={ROLLING_WINDOW}
              currentStreak={currentStreak}
              bestStreak={lifetimeStats?.longestStreak ?? 0}
            />
          )}

          {/* Friends ribbon — kindness signals only. Hidden in local mode and
              when the user has no friends. */}
          {!isGuest && <FriendsRibbon onImpression={handleRibbonImpression} />}

          {/* Calendar / consistency */}
          <div>
            <div className="h-px bg-border mb-8 md:mb-12" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-6">
              {useHeatmap
                ? "Consistency"
                : isActiveHabitTracker
                  ? "Habit Tracker"
                  : `${activeDaysTotal}-Day Calendar`}
            </p>
            {useHeatmap ? (
              <HabitHeatmap
                completionMap={activeCompletionMap}
                currentDay={currentDay}
              />
            ) : (
              <CalendarGrid
                totalDays={calendarLength}
                currentDay={currentDay}
                completionMap={activeCompletionMap}
              />
            )}
          </div>

          {/* Per-habit list — replaces legacy Workouts/Water/Reading tiles */}
          {habitStats.length > 0 && (
            <div>
              <div className="h-px bg-border mb-8 md:mb-12" />
              <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-6">
                Habits — last {Math.min(rolling30.consideredDays, ROLLING_WINDOW)} days
              </p>
              <PerHabitList stats={habitStats} />
            </div>
          )}

          {/* Day-by-Day History — kept polymorphic for legacy + new system */}
          <div>
            <div className="h-px bg-border mb-8 md:mb-12" />
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-8">
              Day-by-Day History
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              {!isGuest && challenges && challenges.length > 1 && (
                <Select
                  value={effectiveHistoryId as string}
                  onValueChange={(val) => {
                    setSelectedChallengeId(val as Id<"challenges">);
                    setExpandedDays(new Set());
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select a challenge" />
                  </SelectTrigger>
                  <SelectContent>
                    {challenges.map((ch) => (
                      <SelectItem key={ch._id} value={ch._id}>
                        <div className="flex items-center gap-2">
                          {ch.status === "active" && (
                            <Play className="h-3 w-3 text-primary" />
                          )}
                          {ch.status === "completed" && (
                            <Trophy className="h-3 w-3 text-success" />
                          )}
                          {ch.status === "failed" && (
                            <XCircle className="h-3 w-3 text-destructive" />
                          )}
                          <span>
                            {new Date(ch.startDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                            {" - Day "}
                            {ch.currentDay}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-2">
                <Button
                  variant={filter === "all" ? "default" : "outline"}
                  onClick={() => setFilter("all")}
                  className="flex-1 sm:flex-none h-11 sm:h-9 active:scale-[0.98] transition-transform"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  All
                </Button>
                <Button
                  variant={filter === "complete" ? "default" : "outline"}
                  onClick={() => setFilter("complete")}
                  className="flex-1 sm:flex-none h-11 sm:h-9 active:scale-[0.98] transition-transform"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Complete
                </Button>
                <Button
                  variant={filter === "incomplete" ? "default" : "outline"}
                  onClick={() => setFilter("incomplete")}
                  className="flex-1 sm:flex-none h-11 sm:h-9 active:scale-[0.98] transition-transform"
                >
                  <X className="h-4 w-4 mr-1" />
                  Incomplete
                </Button>
              </div>
            </div>

            {/* Challenge overview (non-active selection) */}
            {!isGuest &&
              selectedHistoryChallenge &&
              selectedHistoryChallenge._id !== convexUser?.currentChallengeId && (
                <div className="rounded-xl border p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Badge
                        className={cn(
                          selectedHistoryChallenge.status === "active" &&
                            "bg-primary text-primary-foreground",
                          selectedHistoryChallenge.status === "completed" &&
                            "bg-success text-success-foreground",
                          selectedHistoryChallenge.status === "failed" &&
                            "bg-destructive text-destructive-foreground",
                        )}
                      >
                        {selectedHistoryChallenge.status.charAt(0).toUpperCase() +
                          selectedHistoryChallenge.status.slice(1)}
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-2">
                        Started{" "}
                        {new Date(selectedHistoryChallenge.startDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          },
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold tabular-nums">
                        Day {selectedHistoryChallenge.currentDay}
                        <span className="text-sm font-normal text-muted-foreground">
                          {selectedHistoryChallenge.isHabitTracker
                            ? ""
                            : ` / ${selectedHistoryChallenge.daysTotal ?? 75}`}
                        </span>
                      </p>
                      {(selectedHistoryChallenge as ChallengeRowView).failedOnDay !==
                        undefined && (
                        <p className="text-sm text-destructive mt-1">
                          Ended on Day{" "}
                          {(selectedHistoryChallenge as ChallengeRowView).failedOnDay}
                        </p>
                      )}
                    </div>
                  </div>
                  <Progress
                    value={
                      selectedHistoryChallenge.isHabitTracker
                        ? 100
                        : (selectedHistoryChallenge.currentDay /
                            (selectedHistoryChallenge.daysTotal ?? 75)) *
                          100
                    }
                    variant={
                      selectedHistoryChallenge.status === "completed"
                        ? "success"
                        : "default"
                    }
                    className={cn(
                      "h-2",
                      selectedHistoryChallenge.status === "failed" &&
                        "[&>div]:bg-destructive",
                    )}
                  />
                  <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {selectedHistoryChallenge.isHabitTracker
                        ? "Habit tracker"
                        : `${Math.round(
                            (selectedHistoryChallenge.currentDay /
                              (selectedHistoryChallenge.daysTotal ?? 75)) *
                              100,
                          )}% complete`}
                    </span>
                    <span>
                      {Object.values(effectiveHistoryCompletionMap).filter(Boolean)
                        .length}{" "}
                      days fully completed
                    </span>
                  </div>
                </div>
              )}

            {filteredDays.length === 0 ? (
              <EmptyState
                icon={<Calendar className="h-8 w-8" />}
                title="No matching days"
                description={`No ${filter === "complete" ? "complete" : filter === "incomplete" ? "incomplete" : ""} days found.`}
                action={
                  filter !== "all"
                    ? { label: "Show all days", onClick: () => setFilter("all") }
                    : undefined
                }
              />
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-linear-to-b from-primary via-muted to-transparent" />

                <MotionList className="space-y-3">
                  {filteredDays.map((day, index) => {
                    const log = loggedDaysMap.get(day);
                    const dayEntries = historyEntriesByDay.get(day) ?? [];
                    const hasData = isHistoryNewSystem
                      ? dayEntries.length > 0
                      : !!log;
                    const isExpanded = expandedDays.has(day);
                    const isComplete = !!effectiveHistoryCompletionMap[day];

                    return (
                      <MotionListItem key={day} className="relative pl-12">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 20,
                            delay: Math.min(index * 0.05, 0.5),
                          }}
                          className={cn(
                            "absolute left-2 top-4 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-background",
                            isComplete
                              ? "bg-success"
                              : hasData
                                ? "bg-warning"
                                : "bg-muted",
                          )}
                        >
                          {isComplete ? (
                            <Check className="h-3 w-3 text-white" />
                          ) : hasData ? (
                            <span className="text-[10px] font-bold text-white">!</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">-</span>
                          )}
                        </motion.div>

                        <div
                          className={cn(
                            "rounded-lg transition-colors hover:bg-muted/50",
                            isComplete && "bg-success/5 dark:bg-success/10",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => toggleExpanded(day)}
                            aria-expanded={isExpanded}
                            aria-label={`Day ${day} details`}
                            className="w-full min-h-[44px] p-3 flex items-center justify-between text-left rounded-lg active:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          >
                            <div className="flex items-center gap-3">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <div>
                                <p className="text-base font-semibold">Day {day}</p>
                                {log?.date && (
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(log.date).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>

                            <Badge
                              variant="outline"
                              className={cn(
                                isComplete
                                  ? "border-success text-success"
                                  : hasData
                                    ? "border-warning text-warning"
                                    : "border-muted-foreground text-muted-foreground",
                              )}
                            >
                              {isComplete
                                ? (log as { backfilled?: boolean } | undefined)
                                    ?.backfilled
                                  ? "Backfilled"
                                  : "Complete"
                                : hasData
                                  ? "Partial"
                                  : "No data"}
                            </Badge>
                          </button>

                          <AnimatePresence>
                            {isExpanded && (isHistoryNewSystem ? hasData : !!log) && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="px-3 pb-3 pt-0">
                                  {isHistoryNewSystem ? (
                                    <HabitDayDetail
                                      habits={sortedHabitDefs}
                                      entries={dayEntries}
                                    />
                                  ) : (
                                    <LegacyDayDetail log={log as LegacyDayLog} />
                                  )}
                                  {log?.completedAt && (
                                    <p className="text-xs text-muted-foreground mt-3">
                                      Completed at{" "}
                                      {new Date(log.completedAt).toLocaleTimeString(
                                        "en-US",
                                        {
                                          hour: "numeric",
                                          minute: "2-digit",
                                        },
                                      )}
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </MotionListItem>
                    );
                  })}
                </MotionList>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-2">
          {isGuest ? (
            <EmptyState
              title="Sign up to see friend activity"
              description="The activity feed shows your friends' wins as they happen."
            />
          ) : (
            <ActivityFeed feed={mergedActivityFeed} />
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

function HabitDayDetail({
  habits,
  entries,
}: {
  habits: HabitDefView[];
  entries: HistoryEntryView[];
}) {
  const active = habits.filter((h) => h.isActive);
  if (active.length === 0) {
    return (
      <div className="pt-3 border-t">
        <p className="text-sm text-muted-foreground">
          No habits configured for this day.
        </p>
      </div>
    );
  }
  return (
    <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
      {active.map((h) => {
        const entry = entries.find((e) => e.habitDefinitionId === h._id);
        // Counter habits: a row is "done" if either flag is set OR the
        // accumulated value already met the target. The toggle-mutation path
        // sets `completed` for counters at target, but historic / partially
        // synced rows can have value >= target without `completed === true`.
        // Aligning here keeps the day detail consistent with the headline
        // rate's effort-based view.
        const counterMetTarget =
          h.blockType === "counter" &&
          typeof entry?.value === "number" &&
          typeof h.target === "number" &&
          entry.value >= h.target;
        const done = !!entry?.completed || counterMetTarget;
        const valueText =
          h.blockType === "counter" && typeof entry?.value === "number"
            ? `${entry.value}${h.target ? ` / ${h.target}` : ""}${h.unit ? ` ${h.unit}` : ""}`
            : done
              ? "Completed"
              : "Not done";
        return (
          <div
            key={h._id}
            className={cn(
              "p-2 rounded-lg border",
              done ? "bg-success/5 border-success/20" : "bg-muted/50 border-border",
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-xs font-medium truncate">{h.name}</span>
              <Badge
                variant="outline"
                className={cn(
                  "h-4 px-1 text-[9px] tracking-wider uppercase",
                  h.isHard
                    ? "border-primary/40 text-primary"
                    : "border-muted-foreground/40 text-muted-foreground",
                )}
              >
                {h.isHard ? "Hard" : "Soft"}
              </Badge>
              {done && <Check className="h-3 w-3 text-success ml-auto" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{valueText}</p>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Legacy 75-Hard `dailyLogs` rendering, preserved so old completed challenges
 * still display the original task breakdown. New system rendering goes
 * through HabitDayDetail above.
 */
function LegacyDayDetail({ log }: { log: LegacyDayLog }) {
  if (log?.backfilled) {
    return (
      <div className="pt-3 border-t">
        <p className="text-sm text-muted-foreground">
          Self-attested via the reconciliation dialog. Per-task details
          weren&apos;t logged at the time.
        </p>
      </div>
    );
  }
  const items: Array<{ label: string; completed: boolean; value: string }> = [
    {
      label: "Workout 1",
      completed: !!log.workout1 && log.workout1.durationMinutes >= 45,
      value: log.workout1
        ? `${log.workout1.name} (${log.workout1.durationMinutes}min)`
        : "Not logged",
    },
    {
      label: "Workout 2",
      completed: !!log.workout2 && log.workout2.durationMinutes >= 45,
      value: log.workout2
        ? `${log.workout2.name} (${log.workout2.durationMinutes}min)`
        : "Not logged",
    },
    {
      label: "Outdoor",
      completed: log.outdoorWorkoutCompleted,
      value: log.outdoorWorkoutCompleted ? "Yes" : "No",
    },
    {
      label: "Water",
      completed: log.waterIntakeOz >= 128,
      value: `${log.waterIntakeOz} / 128 oz`,
    },
    {
      label: "Reading",
      completed: log.readingMinutes >= 20,
      value: `${log.readingMinutes} / 20 min`,
    },
    {
      label: "Diet",
      completed: log.dietFollowed,
      value: log.dietFollowed ? "Followed" : "Not tracked",
    },
    {
      label: "No Alcohol",
      completed: log.noAlcohol,
      value: log.noAlcohol ? "Yes" : "Not tracked",
    },
    {
      label: "Photo",
      completed: !!log.progressPhotoId,
      value: log.progressPhotoId ? "Uploaded" : "Not taken",
    },
  ];
  return (
    <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className={cn(
            "p-2 rounded-lg border",
            it.completed
              ? "bg-success/5 border-success/20"
              : "bg-muted/50 border-border",
          )}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-medium">{it.label}</span>
            {it.completed && <Check className="h-3 w-3 text-success ml-auto" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{it.value}</p>
        </div>
      ))}
    </div>
  );
}
