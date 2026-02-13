"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
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

type FilterType = "all" | "complete" | "incomplete";

export default function ProgressPage() {
  const { isGuest, demoUser, demoChallenge, demoChallengeLogs, demoLifetimeStats } = useGuest();

  const user = useQuery(api.users.getCurrentUser, isGuest ? "skip" : undefined);
  const challenges = useQuery(
    api.challenges.getUserChallenges,
    isGuest ? "skip" : (user ? { userId: user._id } : "skip")
  );
  const challenge = useQuery(
    api.challenges.getChallenge,
    isGuest ? "skip" : (user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip")
  );
  const logs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : (user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip")
  );
  const photos = useQuery(
    api.dailyLogs.getProgressPhotos,
    isGuest ? "skip" : (user?.currentChallengeId
      ? { challengeId: user.currentChallengeId }
      : "skip")
  );
  const lifetimeStats = useQuery(
    api.challenges.getLifetimeStats,
    isGuest ? "skip" : (user ? { userId: user._id } : "skip")
  );

  // Effective data — use demo for guests
  const effectiveUser = isGuest ? demoUser : user;
  const effectiveChallenge = isGuest ? demoChallenge : challenge;
  const effectiveLogs = isGuest ? demoChallengeLogs : logs;
  const effectiveLifetimeStats = isGuest ? demoLifetimeStats : lifetimeStats;
  const effectivePhotos = isGuest ? [] : photos;

  // History state
  const [selectedChallengeId, setSelectedChallengeId] = useState<Id<"challenges"> | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState<{ url: string; dayNumber: number; date: string } | null>(null);

  // History logs for selected challenge (if different from active)
  const historyLogs = useQuery(
    api.dailyLogs.getChallengeLogs,
    isGuest ? "skip" : (selectedChallengeId && selectedChallengeId !== user?.currentChallengeId
      ? { challengeId: selectedChallengeId }
      : "skip")
  );

  // Auto-select active challenge for history
  const activeChallenge = challenges?.find((c) => c.status === "active");
  const effectiveHistoryId = isGuest ? demoChallenge._id : (selectedChallengeId ?? activeChallenge?._id ?? challenges?.[0]?._id);

  if (!isGuest && !selectedChallengeId && effectiveHistoryId && effectiveHistoryId !== selectedChallengeId) {
    setSelectedChallengeId(effectiveHistoryId);
  }

  const selectedHistoryChallenge = isGuest ? demoChallenge : challenges?.find((c) => c._id === effectiveHistoryId);
  const effectiveHistoryLogs = isGuest
    ? demoChallengeLogs
    : effectiveHistoryId === user?.currentChallengeId ? logs : historyLogs;

  // Filter and sort history
  const loggedDaysMap = new Map(effectiveHistoryLogs?.map((log) => [log.dayNumber, log]));
  const allDays = selectedHistoryChallenge
    ? Array.from({ length: selectedHistoryChallenge.currentDay }, (_, i) => i + 1).reverse()
    : [];
  const filteredDays = allDays.filter((day) => {
    const log = loggedDaysMap.get(day);
    if (filter === "complete") return log?.allRequirementsMet;
    if (filter === "incomplete") return !log?.allRequirementsMet;
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

  const completedDays = effectiveLogs?.filter((log: any) => log.allRequirementsMet).length ?? 0;
  const totalWorkouts = effectiveLogs?.reduce((acc: number, log: any) => {
    let count = 0;
    if (log.workout1) count++;
    if (log.workout2) count++;
    return acc + count;
  }, 0) ?? 0;
  const totalWater = effectiveLogs?.reduce((acc: number, log: any) => acc + log.waterIntakeOz, 0) ?? 0;
  const totalReading = effectiveLogs?.reduce((acc: number, log: any) => acc + log.readingMinutes, 0) ?? 0;

  return (
    <PageContainer>
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
          Progress
        </h1>
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-2">
          Your 75 Hard Journey
        </p>
      </div>

      {/* Stats grid */}
      <MotionGrid className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Days Completed</span>
          </div>
          <p className="text-4xl md:text-5xl font-light tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            {completedDays}
            <span className="text-lg text-muted-foreground/50 ml-1">/ 75</span>
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Best Streak</span>
          </div>
          <p className="text-4xl md:text-5xl font-light tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            {lifetimeStats?.longestStreak ?? 0}
            <span className="text-lg text-muted-foreground/50 ml-1">days</span>
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <RotateCcw className="h-5 w-5 text-chart-4" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Attempt</span>
          </div>
          <p className="text-4xl md:text-5xl font-light tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            #{lifetimeStats?.attemptNumber ?? 1}
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Dumbbell className="h-5 w-5 text-chart-1" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Total Workouts</span>
          </div>
          <p className="text-4xl md:text-5xl font-light tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            {totalWorkouts}
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Droplets className="h-5 w-5 text-chart-2" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Water Consumed</span>
          </div>
          <p className="text-4xl md:text-5xl font-light tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            {Math.round(totalWater / 128)}
            <span className="text-lg text-muted-foreground/50 ml-1">gallons</span>
          </p>
        </motion.div>
        <motion.div variants={fadeUp} className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="h-5 w-5 text-chart-3" />
            <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">Reading Time</span>
          </div>
          <p className="text-4xl md:text-5xl font-light tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
            {totalReading}
            <span className="text-lg text-muted-foreground/50 ml-1">min</span>
          </p>
        </motion.div>
      </MotionGrid>

      {/* Progress Photos Gallery */}
      <div className="h-px bg-border my-16" />
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">Progress Photos</p>
        <MotionItem>
          {effectivePhotos && effectivePhotos.length > 0 ? (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                {effectivePhotos.map((photo: any) => (
                  <button
                    key={photo.storageId}
                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={`Day ${photo.dayNumber}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
            />
          )}
        </MotionItem>
      </div>

      {/* Photo Preview Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
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
          </DialogHeader>
          {selectedPhoto && (
            <img
              src={selectedPhoto.url}
              alt={`Day ${selectedPhoto.dayNumber}`}
              className="w-full rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Calendar view */}
      <div className="h-px bg-border my-16" />
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">75-Day Calendar</p>
        <MotionItem>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerFast}
            className="grid grid-cols-15 gap-1.5"
          >
            {Array.from({ length: 75 }, (_, i) => {
              const dayNumber = i + 1;
              const log = effectiveLogs?.find((l: any) => l.dayNumber === dayNumber);
              const isComplete = log?.allRequirementsMet;
              const isCurrent = dayNumber === effectiveChallenge.currentDay;
              const isPast = dayNumber < effectiveChallenge.currentDay;

              return (
                <motion.div
                  key={dayNumber}
                  variants={fadeUp}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={cn(
                    "aspect-square rounded-md flex items-center justify-center text-xs font-medium cursor-default transition-all",
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
                    <Check className="h-3 w-3" />
                  ) : (
                    dayNumber
                  )}
                </motion.div>
              );
            })}
          </motion.div>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs">
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
      <div className="h-px bg-border my-16" />
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-8">Day-by-Day History</p>
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
              size="sm"
              onClick={() => setFilter("all")}
            >
              <Filter className="h-4 w-4 mr-1" />
              All
            </Button>
            <Button
              variant={filter === "complete" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("complete")}
            >
              <Check className="h-4 w-4 mr-1" />
              Complete
            </Button>
            <Button
              variant={filter === "incomplete" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("incomplete")}
            >
              <X className="h-4 w-4 mr-1" />
              Incomplete
            </Button>
          </div>
        </div>

        {/* Challenge Overview (for non-active challenges) */}
        {!isGuest && selectedHistoryChallenge && selectedHistoryChallenge._id !== user?.currentChallengeId && (
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
                  <span className="text-sm font-normal text-muted-foreground"> / 75</span>
                </p>
                {(selectedHistoryChallenge as any).failedOnDay && (
                  <p className="text-sm text-destructive mt-1">
                    Ended on Day {(selectedHistoryChallenge as any).failedOnDay}
                  </p>
                )}
              </div>
            </div>
            <Progress
              value={(selectedHistoryChallenge.currentDay / 75) * 100}
              variant={selectedHistoryChallenge.status === "completed" ? "success" : "default"}
              className={cn(
                "h-2",
                selectedHistoryChallenge.status === "failed" && "[&>div]:bg-destructive"
              )}
            />
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>
                {Math.round((selectedHistoryChallenge.currentDay / 75) * 100)}% complete
              </span>
              <span>
                {effectiveHistoryLogs?.filter((l) => l.allRequirementsMet).length ?? 0} days fully completed
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
          />
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-muted to-transparent" />

            <MotionList className="space-y-3">
              {filteredDays.map((day, index) => {
                const log = loggedDaysMap.get(day);
                const isExpanded = expandedDays.has(day);
                const isComplete = log?.allRequirementsMet ?? false;

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
                        isComplete ? "bg-success" : log ? "bg-warning" : "bg-muted"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-3 w-3 text-white" />
                      ) : log ? (
                        <span className="text-[10px] font-bold text-white">!</span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">-</span>
                      )}
                    </motion.div>

                    <div
                      className={cn(
                        "rounded-lg p-3 cursor-pointer transition-colors hover:bg-muted/50",
                        isComplete && "bg-success/5 dark:bg-success/10"
                      )}
                      onClick={() => toggleExpanded(day)}
                    >
                      <div className="flex items-center justify-between">
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

                          <Badge
                            variant="outline"
                            className={cn(
                              isComplete
                                ? "border-success text-success"
                                : log
                                ? "border-warning text-warning"
                                : "border-muted-foreground text-muted-foreground"
                            )}
                          >
                            {isComplete ? "Complete" : log ? "Partial" : "No data"}
                          </Badge>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && log && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="pt-3 mt-3 border-t">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <RequirementCard
                                  label="Workout 1"
                                  icon={<Dumbbell className="h-4 w-4" />}
                                  completed={!!log.workout1 && log.workout1.durationMinutes >= 45}
                                  value={log.workout1 ? `${log.workout1.name} (${log.workout1.durationMinutes}min)` : "Not logged"}
                                />
                                <RequirementCard
                                  label="Workout 2"
                                  icon={<Dumbbell className="h-4 w-4" />}
                                  completed={!!log.workout2 && log.workout2.durationMinutes >= 45}
                                  value={log.workout2 ? `${log.workout2.name} (${log.workout2.durationMinutes}min)` : "Not logged"}
                                />
                                <RequirementCard
                                  label="Outdoor"
                                  icon={<TreePine className="h-4 w-4" />}
                                  completed={log.outdoorWorkoutCompleted}
                                  value={log.outdoorWorkoutCompleted ? "Yes" : "No"}
                                />
                                <RequirementCard
                                  label="Water"
                                  icon={<Droplets className="h-4 w-4" />}
                                  completed={log.waterIntakeOz >= 128}
                                  value={`${log.waterIntakeOz} / 128 oz`}
                                />
                                <RequirementCard
                                  label="Reading"
                                  icon={<BookOpen className="h-4 w-4" />}
                                  completed={log.readingMinutes >= 20}
                                  value={`${log.readingMinutes} / 20 min`}
                                />
                                <RequirementCard
                                  label="Diet"
                                  icon={<Utensils className="h-4 w-4" />}
                                  completed={log.dietFollowed}
                                  value={log.dietFollowed ? "Followed" : "Not tracked"}
                                />
                                <RequirementCard
                                  label="No Alcohol"
                                  icon={<Wine className="h-4 w-4" />}
                                  completed={log.noAlcohol}
                                  value={log.noAlcohol ? "Yes" : "Not tracked"}
                                />
                                <RequirementCard
                                  label="Photo"
                                  icon={<Camera className="h-4 w-4" />}
                                  completed={!!log.progressPhotoId}
                                  value={log.progressPhotoId ? "Uploaded" : "Not taken"}
                                />
                              </div>

                              {log.completedAt && (
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
