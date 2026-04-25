"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageContainer } from "@/components/layout/page-container";
import { MotionItem, MotionGrid, MotionList, MotionListItem, fadeUp, staggerContainerFast } from "@/components/ui/motion";
import { StatSkeleton, HeroSkeleton } from "@/components/ui/skeleton-enhanced";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Droplets,
  BookOpen,
  Dumbbell,
  Check,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TreePine,
  Utensils,
  Wine,
  X,
  Filter,
  Trophy,
  Play,
  XCircle,
  Flame,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";
import { useGuest } from "@/components/guest-provider";
import { useSwipe } from "@/hooks/use-swipe";
import { useRouter } from "next/navigation";
import { effectiveDaysTotal, formatEndDate } from "@/lib/day-utils";
import {
  useLocalActiveChallenge,
  useLocalUserChallenges,
  useLocalHabitDefinitions,
  useLocalAllEntriesForChallenge,
  useLocalDayCompletionMap,
} from "@/lib/local-store/hooks";

type FilterType = "all" | "complete" | "incomplete";

export default function ProgressPage() {
  const router = useRouter();
  const { isGuest, demoUser, demoChallenge, demoLifetimeStats } = useGuest();

  const convexUser = useQuery(api.users.getCurrentUser, isGuest ? "skip" : undefined);
  const user = isGuest ? demoUser : convexUser;
  const convexChallenges = useQuery(
    api.challenges.getUserChallenges,
    isGuest ? "skip" : (convexUser ? { userId: convexUser._id } : "skip")
  );
  const localChallenges = useLocalUserChallenges();
  const challenges = isGuest ? localChallenges : convexChallenges;
  const convexChallenge = useQuery(
    api.challenges.getChallenge,
    isGuest ? "skip" : (convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip")
  );
  const localChallenge = useLocalActiveChallenge();
  const challenge = isGuest ? localChallenge : convexChallenge;
  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : (convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip")
  );
  const photos = useQuery(
    api.dailyLogs.getProgressPhotos,
    isGuest ? "skip" : (convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip")
  );
  const convexLifetimeStats = useQuery(
    api.challenges.getLifetimeStats,
    isGuest ? "skip" : (convexUser ? { userId: convexUser._id } : "skip")
  );
  const convexActiveCompletionMap = useQuery(
    api.challenges.getDayCompletionMap,
    isGuest ? "skip" : (convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip")
  );
  const localActiveCompletionMap = useLocalDayCompletionMap(
    isGuest ? localChallenge?._id : undefined,
  );
  const activeCompletionMap = isGuest
    ? localActiveCompletionMap
    : convexActiveCompletionMap;
  const convexActiveHabitDefs = useQuery(
    api.habitDefinitions.getHabitDefinitions,
    isGuest ? "skip" : (convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip")
  );
  const localActiveHabitDefs = useLocalHabitDefinitions(
    isGuest ? localChallenge?._id : undefined,
  );
  const activeHabitDefs = isGuest ? localActiveHabitDefs : convexActiveHabitDefs;
  const convexActiveHabitEntries = useQuery(
    api.habitEntries.getAllEntriesForChallenge,
    isGuest ? "skip" : (convexUser?.currentChallengeId
      ? { challengeId: convexUser.currentChallengeId }
      : "skip")
  );
  const localActiveHabitEntries = useLocalAllEntriesForChallenge(
    isGuest ? localChallenge?._id : undefined,
  );
  const activeHabitEntries = isGuest
    ? localActiveHabitEntries
    : convexActiveHabitEntries;

  // Effective data
  const effectiveUser = user;
  const effectiveChallenge = challenge;
  const effectiveLogs = isGuest ? [] : logs;
  const effectiveLifetimeStats = isGuest ? demoLifetimeStats : convexLifetimeStats;
  const effectivePhotos = isGuest ? [] : photos;

  // History state
  const [selectedChallengeId, setSelectedChallengeId] = useState<Id<"challenges"> | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  // History logs for selected challenge (if different from active).
  // Local mode never shows the multi-challenge selector for v1, so we
  // can keep these Convex-only.
  const historyLogs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : (selectedChallengeId && selectedChallengeId !== convexUser?.currentChallengeId
      ? { challengeId: selectedChallengeId }
      : "skip")
  );
  const historyCompletionMap = useQuery(
    api.challenges.getDayCompletionMap,
    isGuest ? "skip" : (selectedChallengeId && selectedChallengeId !== convexUser?.currentChallengeId
      ? { challengeId: selectedChallengeId }
      : "skip")
  );
  const historyHabitDefs = useQuery(
    api.habitDefinitions.getHabitDefinitions,
    isGuest ? "skip" : (selectedChallengeId && selectedChallengeId !== convexUser?.currentChallengeId
      ? { challengeId: selectedChallengeId }
      : "skip")
  );
  const historyHabitEntries = useQuery(
    api.habitEntries.getAllEntriesForChallenge,
    isGuest ? "skip" : (selectedChallengeId && selectedChallengeId !== convexUser?.currentChallengeId
      ? { challengeId: selectedChallengeId }
      : "skip")
  );

  // Auto-select active challenge for history
  const activeChallenge = challenges?.find((c) => c.status === "active");
  const effectiveHistoryId = isGuest
    ? localChallenge?._id
    : (selectedChallengeId ?? activeChallenge?._id ?? challenges?.[0]?._id);

  // Auto-select the active (or most-recent) challenge in the history view
  // once Convex queries resolve. Done in an effect — calling setState
  // during render trips React's "cannot update during render" warning.
  useEffect(() => {
    if (
      !isGuest &&
      !selectedChallengeId &&
      effectiveHistoryId &&
      effectiveHistoryId !== selectedChallengeId
    ) {
      setSelectedChallengeId(effectiveHistoryId as Id<"challenges">);
    }
  }, [isGuest, selectedChallengeId, effectiveHistoryId]);

  const selectedHistoryChallenge = isGuest
    ? localChallenge
    : challenges?.find((c) => c._id === effectiveHistoryId);
  const effectiveHistoryLogs = isGuest
    ? []
    : effectiveHistoryId === convexUser?.currentChallengeId ? logs : historyLogs;

  const effectiveHistoryCompletionMap: Record<number, boolean> = isGuest
    ? (localActiveCompletionMap ?? {})
    : (effectiveHistoryId === convexUser?.currentChallengeId
        ? (activeCompletionMap ?? {})
        : (historyCompletionMap ?? {}));

  const activeEffectiveCompletionMap: Record<number, boolean> = isGuest
    ? (localActiveCompletionMap ?? {})
    : (activeCompletionMap ?? {});

  const effectiveHistoryHabitDefs = isGuest
    ? localActiveHabitDefs
    : (effectiveHistoryId === convexUser?.currentChallengeId ? activeHabitDefs : historyHabitDefs);
  const effectiveHistoryHabitEntries = isGuest
    ? localActiveHabitEntries
    : (effectiveHistoryId === convexUser?.currentChallengeId ? activeHabitEntries : historyHabitEntries);
  const isHistoryNewSystem = isGuest || (!!effectiveHistoryHabitDefs && effectiveHistoryHabitDefs.length > 0);

  // Filter and sort history
  const loggedDaysMap = new Map(effectiveHistoryLogs?.map((log) => [log.dayNumber, log]));
  const historyEntriesByDay = new Map<number, any[]>();
  for (const e of (effectiveHistoryHabitEntries ?? [])) {
    const list = historyEntriesByDay.get(e.dayNumber) ?? [];
    list.push(e);
    historyEntriesByDay.set(e.dayNumber, list);
  }
  const sortedHabitDefs = effectiveHistoryHabitDefs
    ? [...effectiveHistoryHabitDefs].sort((a: any, b: any) => a.sortOrder - b.sortOrder)
    : [];
  const allDays = selectedHistoryChallenge
    ? Array.from({ length: selectedHistoryChallenge.currentDay }, (_, i) => i + 1).reverse()
    : [];
  const filteredDays = allDays.filter((day) => {
    const isComplete = !!effectiveHistoryCompletionMap[day];
    if (filter === "complete") return isComplete;
    if (filter === "incomplete") return !isComplete;
    return true;
  });

  const toggleExpanded = (day: number) => {
    const newSet = new Set(expandedDays);
    if (newSet.has(day)) {
      newSet.delete(day);
    } else {
      newSet.add(day);
    }
    setExpandedDays(newSet);
  };

  // Lightbox navigation
  const selectedPhoto = selectedPhotoIndex !== null && effectivePhotos
    ? effectivePhotos[selectedPhotoIndex] ?? null
    : null;
  const prevIndexRef = useRef(selectedPhotoIndex);
  const [slideDirection, setSlideDirection] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (selectedPhotoIndex !== null && prevIndexRef.current !== null && selectedPhotoIndex !== prevIndexRef.current) {
      setSlideDirection(selectedPhotoIndex > prevIndexRef.current ? 1 : -1);
    }
    prevIndexRef.current = selectedPhotoIndex;
  }, [selectedPhotoIndex]);

  const photoCount = effectivePhotos?.length ?? 0;

  const goToPrevPhoto = useCallback(() => {
    setSelectedPhotoIndex((i) => (i !== null && i > 0 ? i - 1 : i));
  }, []);

  const goToNextPhoto = useCallback(() => {
    setSelectedPhotoIndex((i) => (i !== null && i < photoCount - 1 ? i + 1 : i));
  }, [photoCount]);

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(goToNextPhoto, goToPrevPhoto);

  useEffect(() => {
    if (selectedPhotoIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevPhoto();
      else if (e.key === "ArrowRight") goToNextPhoto();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPhotoIndex, goToPrevPhoto, goToNextPhoto]);

  // Preload adjacent full-res images for instant navigation
  useEffect(() => {
    if (selectedPhotoIndex === null || !effectivePhotos) return;
    const toPreload: string[] = [];
    if (selectedPhotoIndex > 0) toPreload.push(effectivePhotos[selectedPhotoIndex - 1]?.url);
    if (selectedPhotoIndex < photoCount - 1) toPreload.push(effectivePhotos[selectedPhotoIndex + 1]?.url);
    toPreload.forEach((src) => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [selectedPhotoIndex, effectivePhotos, photoCount]);

  const SLIDE_OFFSET = 80;
  const slideVariants = prefersReducedMotion
    ? { enter: {}, center: {}, exit: {} }
    : {
        enter: (dir: number) => ({ x: dir > 0 ? SLIDE_OFFSET : -SLIDE_OFFSET, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -SLIDE_OFFSET : SLIDE_OFFSET, opacity: 0 }),
      };

  if (!isGuest && user === undefined) {
    return (
      <div className="max-w-4xl space-y-6">
        <div>
          <div className="h-9 w-32 rounded-md bg-muted animate-pulse" />
          <div className="h-5 w-64 mt-2 rounded-md bg-muted animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
        <HeroSkeleton />
      </div>
    );
  }

  if (!effectiveUser || !effectiveChallenge) {
    return (
      <PageContainer>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Progress
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">
          Start a challenge to see your progress here.
        </p>
      </PageContainer>
    );
  }

  const completedDays = Object.values(activeEffectiveCompletionMap).filter(Boolean).length;
  // Effective challenge length for the active challenge. null = habit-tracker mode.
  const activeDaysTotal = effectiveDaysTotal(effectiveChallenge);
  const isActiveHabitTracker = activeDaysTotal === null;
  // Calendar grid sizing: bounded challenges show daysTotal cells; habit
  // trackers grow rolling — show currentDay + 7 to give a small forward window.
  const gridLength = isActiveHabitTracker
    ? Math.max(effectiveChallenge.currentDay + 7, 14)
    : (activeDaysTotal ?? 75);
  // Aggregate metrics are built from actually-logged activity, so we exclude
  // backfilled rows — those only record "day completed" via self-attestation
  // and would otherwise pull sums toward zero.
  const metricLogs = effectiveLogs?.filter((log: any) => !log.backfilled) ?? [];
  const totalWorkouts = metricLogs.reduce((acc: number, log: any) => {
    let count = 0;
    if (log.workout1) count++;
    if (log.workout2) count++;
    return acc + count;
  }, 0);
  const totalWater = metricLogs.reduce((acc: number, log: any) => acc + log.waterIntakeOz, 0);
  const totalReading = metricLogs.reduce((acc: number, log: any) => acc + log.readingMinutes, 0);

  return (
    <PageContainer>
      <div className="mb-8 md:mb-16">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Progress
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">
          {isActiveHabitTracker
            ? "Habit tracker — no end date"
            : `Ends on ${formatEndDate(effectiveChallenge.startDate, activeDaysTotal ?? 75)}`}
        </p>
      </div>

      {/* Stats grid */}
      <MotionGrid className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-3">
        <motion.div variants={fadeUp} className="rounded-xl border bg-card/40 p-3 md:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3 min-w-0">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-[9px] md:text-[10px] tracking-[0.14em] md:tracking-[0.2em] uppercase text-muted-foreground truncate">Days Completed</span>
          </div>
          <p className="text-3xl md:text-5xl font-light tabular-nums leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            {completedDays}
            <span className="text-sm md:text-lg text-muted-foreground/50 ml-1">
              {isActiveHabitTracker ? "" : `/ ${activeDaysTotal}`}
            </span>
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-xl border bg-card/40 p-3 md:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3 min-w-0">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-[9px] md:text-[10px] tracking-[0.14em] md:tracking-[0.2em] uppercase text-muted-foreground truncate">Best Streak</span>
          </div>
          <p className="text-3xl md:text-5xl font-light tabular-nums leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            {effectiveLifetimeStats?.longestStreak ?? 0}
            <span className="text-sm md:text-lg text-muted-foreground/50 ml-1">days</span>
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-xl border bg-card/40 p-3 md:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3 min-w-0">
            <RotateCcw className="h-5 w-5 text-chart-4" />
            <span className="text-[9px] md:text-[10px] tracking-[0.14em] md:tracking-[0.2em] uppercase text-muted-foreground truncate">Attempt</span>
          </div>
          <p className="text-3xl md:text-5xl font-light tabular-nums leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            #{effectiveLifetimeStats?.attemptNumber ?? 1}
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-xl border bg-card/40 p-3 md:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3 min-w-0">
            <Dumbbell className="h-5 w-5 text-chart-1" />
            <span className="text-[9px] md:text-[10px] tracking-[0.14em] md:tracking-[0.2em] uppercase text-muted-foreground truncate">Total Workouts</span>
          </div>
          <p className="text-3xl md:text-5xl font-light tabular-nums leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            {totalWorkouts}
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-xl border bg-card/40 p-3 md:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3 min-w-0">
            <Droplets className="h-5 w-5 text-chart-2" />
            <span className="text-[9px] md:text-[10px] tracking-[0.14em] md:tracking-[0.2em] uppercase text-muted-foreground truncate">Water Consumed</span>
          </div>
          <p className="text-3xl md:text-5xl font-light tabular-nums leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            {Math.round(totalWater / 128)}
            <span className="text-sm md:text-lg text-muted-foreground/50 ml-1">gallons</span>
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="rounded-xl border bg-card/40 p-3 md:p-5 text-left">
          <div className="flex items-center gap-2 mb-1.5 md:mb-3 min-w-0">
            <BookOpen className="h-5 w-5 text-chart-3" />
            <span className="text-[9px] md:text-[10px] tracking-[0.14em] md:tracking-[0.2em] uppercase text-muted-foreground truncate">Reading Time</span>
          </div>
          <p className="text-3xl md:text-5xl font-light tabular-nums leading-none" style={{ fontFamily: "var(--font-heading)" }}>
            {totalReading}
            <span className="text-sm md:text-lg text-muted-foreground/50 ml-1">min</span>
          </p>
        </motion.div>
      </MotionGrid>

      {/* Progress Photos Gallery */}
      <div className="h-px bg-border my-8 md:my-16" />
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-8">Progress Photos</p>
        <MotionItem>
          {effectivePhotos && effectivePhotos.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {effectivePhotos.map((photo: any, index: number) => (
                  <button
                    key={photo.storageId}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.97] transition-transform"
                    onClick={() => setSelectedPhotoIndex(index)}
                  >
                    <img
                      src={photo.thumbUrl ?? photo.url}
                      alt={`Day ${photo.dayNumber}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
                    <Badge className="absolute bottom-1 left-1 text-[10px] h-5 bg-black/70 text-white border-0">
                      Day {photo.dayNumber}
                    </Badge>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Photos are private and never shared with friends.
              </p>
            </>
          ) : (
            <EmptyState
              icon={<Camera className="h-8 w-8" />}
              title="No progress photos yet"
              description="Your daily photos will appear here as you upload them."
              action={
                !isGuest
                  ? { label: "Take today's photo", onClick: () => router.push("/dashboard") }
                  : undefined
              }
            />
          )}
        </MotionItem>
      </div>

      {/* Photo Lightbox Dialog */}
      <Dialog open={selectedPhotoIndex !== null} onOpenChange={() => setSelectedPhotoIndex(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              Day {selectedPhoto?.dayNumber} —{" "}
              {selectedPhoto?.date &&
                new Date(selectedPhoto.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
            </DialogTitle>
            <DialogDescription>
              Photo {selectedPhotoIndex !== null ? selectedPhotoIndex + 1 : 0} of {photoCount}
            </DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div
              className="relative touch-pan-y overflow-hidden select-none"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait" custom={slideDirection} initial={false}>
                <motion.img
                  key={selectedPhotoIndex}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={
                    prefersReducedMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 300, damping: 30 }
                  }
                  src={selectedPhoto.url}
                  alt={`Day ${selectedPhoto.dayNumber}`}
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                  draggable={false}
                />
              </AnimatePresence>

              {/* Previous arrow */}
              {selectedPhotoIndex !== null && selectedPhotoIndex > 0 && (
                <button
                  onClick={goToPrevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/70 active:bg-black/80 text-white h-11 w-11 flex items-center justify-center transition-opacity opacity-80 sm:opacity-70 sm:hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Next arrow */}
              {selectedPhotoIndex !== null && selectedPhotoIndex < photoCount - 1 && (
                <button
                  onClick={goToNextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 hover:bg-black/70 active:bg-black/80 text-white h-11 w-11 flex items-center justify-center transition-opacity opacity-80 sm:opacity-70 sm:hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Next photo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar view */}
      <div className="h-px bg-border my-8 md:my-16" />
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-8">
          {isActiveHabitTracker
            ? "Habit Tracker"
            : `${activeDaysTotal}-Day Calendar`}
        </p>
        <MotionItem>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerFast}
            className="grid grid-cols-15 gap-1 sm:gap-1.5 min-w-0"
          >
            {Array.from({ length: gridLength }, (_, i) => {
              const dayNumber = i + 1;
              const isComplete = !!activeEffectiveCompletionMap[dayNumber];
              const isCurrent = dayNumber === effectiveChallenge.currentDay;
              const isPast = dayNumber < effectiveChallenge.currentDay;

              return (
                <motion.div
                  key={dayNumber}
                  variants={fadeUp}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-[10px] sm:text-xs font-medium cursor-default transition-all min-w-0",
                    isComplete
                      ? "bg-success text-success-foreground shadow-sm"
                      : isCurrent
                      ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/30"
                      : isPast
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground"
                  )}
                  title={`Day ${dayNumber}${isComplete ? " - Complete" : ""}`}
                >
                  {isComplete ? (
                    <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  ) : (
                    dayNumber
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          <div className="mt-4 md:mt-6 flex flex-wrap items-center gap-3 md:gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-md bg-success shadow-sm" />
              <span className="text-muted-foreground">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-md bg-primary ring-2 ring-primary/30" />
              <span className="text-muted-foreground">Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-md bg-destructive/10" />
              <span className="text-muted-foreground">Missed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded-md bg-muted" />
              <span className="text-muted-foreground">Upcoming</span>
            </div>
          </div>
        </MotionItem>
      </div>

      {/* Day-by-Day History */}
      <div className="h-px bg-border my-8 md:my-16" />
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4 md:mb-8">Day-by-Day History</p>
        {/* Challenge Selector and Filters */}
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

        {/* Challenge Overview (for non-active challenges) */}
        {!isGuest && selectedHistoryChallenge && selectedHistoryChallenge._id !== convexUser?.currentChallengeId && (
          <div className="rounded-xl border p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge
                  className={cn(
                    selectedHistoryChallenge.status === "active" && "bg-primary text-primary-foreground",
                    selectedHistoryChallenge.status === "completed" && "bg-success text-success-foreground",
                    selectedHistoryChallenge.status === "failed" && "bg-destructive text-destructive-foreground"
                  )}
                >
                  {selectedHistoryChallenge.status.charAt(0).toUpperCase() + selectedHistoryChallenge.status.slice(1)}
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Started {new Date(selectedHistoryChallenge.startDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
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
                {(selectedHistoryChallenge as any).failedOnDay && (
                  <p className="text-sm text-destructive mt-1">
                    Ended on Day {(selectedHistoryChallenge as any).failedOnDay}
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
              variant={selectedHistoryChallenge.status === "completed" ? "success" : "default"}
              className={cn(
                "h-2",
                selectedHistoryChallenge.status === "failed" && "[&>div]:bg-destructive"
              )}
            />
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {selectedHistoryChallenge.isHabitTracker
                  ? "Habit tracker"
                  : `${Math.round((selectedHistoryChallenge.currentDay / (selectedHistoryChallenge.daysTotal ?? 75)) * 100)}% complete`}
              </span>
              <span>
                {Object.values(effectiveHistoryCompletionMap).filter(Boolean).length} days fully completed
              </span>
            </div>
          </div>
        )}

        {/* Timeline */}
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
                const hasData = isHistoryNewSystem ? dayEntries.length > 0 : !!log;
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
                        isComplete ? "bg-success" : hasData ? "bg-warning" : "bg-muted"
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
                        isComplete && "bg-success/5 dark:bg-success/10"
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
                          <div className="flex items-center gap-1">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
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

                        <div className="flex items-center gap-2">
                          {!isHistoryNewSystem && !(log as { backfilled?: boolean } | undefined)?.backfilled && (
                            <div className="hidden sm:flex items-center gap-1">
                              <RequirementDot completed={!!log?.workout1 && log.workout1.durationMinutes >= 45} icon={<Dumbbell className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={!!log?.workout2 && log.workout2.durationMinutes >= 45} icon={<Dumbbell className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={log?.outdoorWorkoutCompleted ?? false} icon={<TreePine className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={(log?.waterIntakeOz ?? 0) >= 128} icon={<Droplets className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={(log?.readingMinutes ?? 0) >= 20} icon={<BookOpen className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={log?.dietFollowed ?? false} icon={<Utensils className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={log?.noAlcohol ?? false} icon={<Wine className="h-2.5 w-2.5" />} />
                              <RequirementDot completed={!!log?.progressPhotoId} icon={<Camera className="h-2.5 w-2.5" />} />
                            </div>
                          )}

                          <Badge
                            variant="outline"
                            className={cn(
                              isComplete
                                ? "border-success text-success"
                                : hasData
                                ? "border-warning text-warning"
                                : "border-muted-foreground text-muted-foreground"
                            )}
                          >
                            {isComplete
                              ? (log as { backfilled?: boolean } | undefined)?.backfilled
                                ? "Backfilled"
                                : "Complete"
                              : hasData
                              ? "Partial"
                              : "No data"}
                          </Badge>
                        </div>
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
                                <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {sortedHabitDefs
                                    .filter((h: any) => h.isActive)
                                    .map((h: any) => {
                                      const entry = dayEntries.find((e: any) => e.habitDefinitionId === h._id);
                                      const done = !!entry?.completed;
                                      const valueText = h.blockType === "counter" && typeof entry?.value === "number"
                                        ? `${entry.value}${h.target ? ` / ${h.target}` : ""}${h.unit ? ` ${h.unit}` : ""}`
                                        : done
                                        ? "Completed"
                                        : "Not done";
                                      return (
                                        <HabitRequirementCard
                                          key={h._id}
                                          label={h.name}
                                          completed={done}
                                          value={valueText}
                                          isHard={h.isHard}
                                        />
                                      );
                                    })}
                                </div>
                              ) : (log as { backfilled?: boolean } | undefined)?.backfilled ? (
                                <div className="pt-3 border-t">
                                  <p className="text-sm text-muted-foreground">
                                    Self-attested via the reconciliation dialog. Per-task
                                    details weren&apos;t logged at the time.
                                  </p>
                                </div>
                              ) : (
                                <div className="pt-3 border-t grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                                  <RequirementCard
                                    label="Workout 1"
                                    icon={<Dumbbell className="h-4 w-4" />}
                                    completed={!!log!.workout1 && log!.workout1.durationMinutes >= 45}
                                    value={log!.workout1 ? `${log!.workout1.name} (${log!.workout1.durationMinutes}min)` : "Not logged"}
                                  />
                                  <RequirementCard
                                    label="Workout 2"
                                    icon={<Dumbbell className="h-4 w-4" />}
                                    completed={!!log!.workout2 && log!.workout2.durationMinutes >= 45}
                                    value={log!.workout2 ? `${log!.workout2.name} (${log!.workout2.durationMinutes}min)` : "Not logged"}
                                  />
                                  <RequirementCard
                                    label="Outdoor"
                                    icon={<TreePine className="h-4 w-4" />}
                                    completed={log!.outdoorWorkoutCompleted}
                                    value={log!.outdoorWorkoutCompleted ? "Yes" : "No"}
                                  />
                                  <RequirementCard
                                    label="Water"
                                    icon={<Droplets className="h-4 w-4" />}
                                    completed={log!.waterIntakeOz >= 128}
                                    value={`${log!.waterIntakeOz} / 128 oz`}
                                  />
                                  <RequirementCard
                                    label="Reading"
                                    icon={<BookOpen className="h-4 w-4" />}
                                    completed={log!.readingMinutes >= 20}
                                    value={`${log!.readingMinutes} / 20 min`}
                                  />
                                  <RequirementCard
                                    label="Diet"
                                    icon={<Utensils className="h-4 w-4" />}
                                    completed={log!.dietFollowed}
                                    value={log!.dietFollowed ? "Followed" : "Not tracked"}
                                  />
                                  <RequirementCard
                                    label="No Alcohol"
                                    icon={<Wine className="h-4 w-4" />}
                                    completed={log!.noAlcohol}
                                    value={log!.noAlcohol ? "Yes" : "Not tracked"}
                                  />
                                  <RequirementCard
                                    label="Photo"
                                    icon={<Camera className="h-4 w-4" />}
                                    completed={!!log!.progressPhotoId}
                                    value={log!.progressPhotoId ? "Uploaded" : "Not taken"}
                                  />
                                </div>
                              )}

                              {log?.completedAt && (
                                <p className="text-xs text-muted-foreground mt-3">
                                  Completed at {new Date(log.completedAt).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
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
    </PageContainer>
  );
}

function RequirementDot({ completed, icon }: { completed: boolean; icon: React.ReactNode }) {
  return (
    <div
      className={cn(
        "w-5 h-5 rounded-full flex items-center justify-center",
        completed ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
      )}
    >
      {icon}
    </div>
  );
}

function HabitRequirementCard({
  label,
  completed,
  value,
  isHard,
}: {
  label: string;
  completed: boolean;
  value: string;
  isHard: boolean;
}) {
  return (
    <div
      className={cn(
        "p-2 rounded-lg border",
        completed
          ? "bg-success/5 border-success/20"
          : "bg-muted/50 border-border"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-xs font-medium truncate">{label}</span>
        <Badge
          variant="outline"
          className={cn(
            "h-4 px-1 text-[9px] tracking-wider uppercase",
            isHard ? "border-primary/40 text-primary" : "border-muted-foreground/40 text-muted-foreground"
          )}
        >
          {isHard ? "Hard" : "Soft"}
        </Badge>
        {completed && <Check className="h-3 w-3 text-success ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground truncate">{value}</p>
    </div>
  );
}

function RequirementCard({
  label,
  icon,
  completed,
  value,
}: {
  label: string;
  icon: React.ReactNode;
  completed: boolean;
  value: string;
}) {
  return (
    <div
      className={cn(
        "p-2 rounded-lg border",
        completed
          ? "bg-success/5 border-success/20"
          : "bg-muted/50 border-border"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <div className={completed ? "text-success" : "text-muted-foreground"}>
          {icon}
        </div>
        <span className="text-xs font-medium">{label}</span>
        {completed && <Check className="h-3 w-3 text-success ml-auto" />}
      </div>
      <p className="text-xs text-muted-foreground truncate">{value}</p>
    </div>
  );
}
