"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Badge } from "@/components/ui/badge";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Dumbbell, Sparkles, Brain, Apple, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DailyChecklistProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
}

export function DailyChecklist({
  challengeId,
  userId,
  dayNumber,
  date,
}: DailyChecklistProps) {
  const dailyLog = useQuery(api.dailyLogs.getDailyLog, {
    challengeId,
    dayNumber,
  });
  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const updateWater = useMutation(api.dailyLogs.updateWaterIntake);
  const quickLog = useMutation(api.dailyLogs.quickLogWorkout);
  const clearWorkout = useMutation(api.dailyLogs.clearWorkout);
  const { isActive: confettiActive, trigger: triggerConfetti } = useConfetti();
  const prevAllMetRef = useRef(false);

  useEffect(() => {
    if (dailyLog?.allRequirementsMet && !prevAllMetRef.current) {
      triggerConfetti();
    }
    prevAllMetRef.current = dailyLog?.allRequirementsMet ?? false;
  }, [dailyLog?.allRequirementsMet, triggerConfetti]);

  const handleToggle = async (
    field: "dietFollowed" | "noAlcohol",
    value: boolean
  ) => {
    try {
      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        [field]: value,
      });
      toast.success(value ? "Marked as complete!" : "Unmarked");
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleQuickWorkout = async (workoutNumber: 1 | 2) => {
    try {
      await quickLog({
        challengeId,
        userId,
        dayNumber,
        date,
        workoutNumber,
      });
      toast.success("Workout logged!");
    } catch {
      toast.error("Failed to log workout");
    }
  };

  const handleClearWorkout = async (workoutNumber: 1 | 2) => {
    try {
      await clearWorkout({
        challengeId,
        dayNumber,
        workoutNumber,
      });
      toast.success("Workout cleared");
    } catch {
      toast.error("Failed to clear workout");
    }
  };

  const handleWaterChange = async (amount: number) => {
    const newAmount = Math.max(0, (dailyLog?.waterIntakeOz ?? 0) + amount);
    await updateWater({
      challengeId,
      userId,
      dayNumber,
      date,
      waterIntakeOz: newAmount,
    });
  };

  const handleReadingChange = async (minutes: number) => {
    const newMinutes = Math.max(0, (dailyLog?.readingMinutes ?? 0) + minutes);
    await updateLog({
      challengeId,
      userId,
      dayNumber,
      date,
      readingMinutes: newMinutes,
    });
  };


  const workout1Done = !!dailyLog?.workout1 && dailyLog.workout1.durationMinutes >= 45;
  const workout2Done = !!dailyLog?.workout2 && dailyLog.workout2.durationMinutes >= 45;

  const fitnessComplete = workout1Done && workout2Done;

  const nutritionComplete =
    (dailyLog?.waterIntakeOz ?? 0) >= 128 &&
    (dailyLog?.dietFollowed ?? false) &&
    (dailyLog?.noAlcohol ?? false);

  const mindProgressComplete =
    (dailyLog?.readingMinutes ?? 0) >= 20 &&
    !!dailyLog?.progressPhotoId;

  return (
    <>
      <Confetti isActive={confettiActive} />

      <div className="space-y-10">
        {/* Fitness Section */}
        <CategorySection
          title="Fitness"
          icon={<Dumbbell className="h-4 w-4" />}
          isComplete={fitnessComplete}
        >
          <TodoItem
            label="Indoor Workout"
            detail={dailyLog?.workout1 ? `${dailyLog.workout1.name} — ${dailyLog.workout1.durationMinutes} min` : "45 min"}
            done={workout1Done}
            onTap={workout1Done ? () => handleClearWorkout(1) : () => handleQuickWorkout(1)}
            isLast={false}
          >
            {workout1Done ? (
              <WorkoutButton
                challengeId={challengeId}
                userId={userId}
                dayNumber={dayNumber}
                date={date}
                workoutNumber={1}
                existingWorkout={dailyLog?.workout1}
                label="Edit Workout"
                forceOutdoor={false}
              />
            ) : (
              <WorkoutButton
                challengeId={challengeId}
                userId={userId}
                dayNumber={dayNumber}
                date={date}
                workoutNumber={1}
                existingWorkout={dailyLog?.workout1}
                label="Add details"
                variant="ghost"
                forceOutdoor={false}
              />
            )}
          </TodoItem>

          <TodoItem
            label="Outdoor Workout"
            detail={dailyLog?.workout2 ? `${dailyLog.workout2.name} — ${dailyLog.workout2.durationMinutes} min` : "45 min, must be outside"}
            done={workout2Done}
            onTap={workout2Done ? () => handleClearWorkout(2) : () => handleQuickWorkout(2)}
            isLast={true}
          >
            {workout2Done ? (
              <WorkoutButton
                challengeId={challengeId}
                userId={userId}
                dayNumber={dayNumber}
                date={date}
                workoutNumber={2}
                existingWorkout={dailyLog?.workout2}
                label="Edit Workout"
                forceOutdoor={true}
              />
            ) : (
              <WorkoutButton
                challengeId={challengeId}
                userId={userId}
                dayNumber={dayNumber}
                date={date}
                workoutNumber={2}
                existingWorkout={dailyLog?.workout2}
                label="Add details"
                variant="ghost"
                forceOutdoor={true}
              />
            )}
          </TodoItem>
        </CategorySection>

        {/* Nutrition Section */}
        <CategorySection
          title="Nutrition"
          icon={<Apple className="h-4 w-4" />}
          isComplete={nutritionComplete}
        >
          <WaterChecklist
            waterOz={dailyLog?.waterIntakeOz ?? 0}
            onWaterChange={handleWaterChange}
            isLast={false}
          />

          <TodoItem
            label="Follow Diet"
            detail="No cheat meals"
            done={dailyLog?.dietFollowed ?? false}
            onTap={() => handleToggle("dietFollowed", !dailyLog?.dietFollowed)}
            isLast={false}
          />

          <TodoItem
            label="No Alcohol"
            detail="Stay alcohol-free"
            done={dailyLog?.noAlcohol ?? false}
            onTap={() => handleToggle("noAlcohol", !dailyLog?.noAlcohol)}
            isLast={true}
          />
        </CategorySection>

        {/* Mind & Progress Section */}
        <CategorySection
          title="Mind & Progress"
          icon={<Brain className="h-4 w-4" />}
          isComplete={mindProgressComplete}
        >
          <ReadingChecklist
            readingMinutes={dailyLog?.readingMinutes ?? 0}
            onReadingChange={handleReadingChange}
            isLast={false}
          />

          <PhotoRow
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            hasPhoto={!!dailyLog?.progressPhotoId}
          />
        </CategorySection>

        {/* All requirements status */}
        <AnimatePresence>
          {dailyLog?.allRequirementsMet && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="flex items-center justify-center gap-2 py-6 text-center"
            >
              <Sparkles className="h-5 w-5 text-success" />
              <p className="text-sm font-medium text-success">
                All requirements completed for today!
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}

function CategorySection({
  title,
  icon,
  isComplete,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-1 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className={cn("transition-colors", isComplete ? "text-success" : "text-muted-foreground")}>{icon}</span>
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </h3>
        </div>
        {isComplete && (
          <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px] h-5">
            <Check className="mr-1 h-2.5 w-2.5" />
            Done
          </Badge>
        )}
      </div>

      {/* Items list */}
      <div>
        {children}
      </div>
    </div>
  );
}

function TodoItem({
  label,
  detail,
  done,
  progress,
  isLast,
  onTap,
  children,
}: {
  label: string;
  detail: string;
  done: boolean;
  progress?: number;
  isLast: boolean;
  onTap?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors",
        !isLast && "border-b border-border/50",
        onTap && "cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg",
        done && "opacity-60"
      )}
      onClick={onTap}
      role={onTap ? "button" : undefined}
      tabIndex={onTap ? 0 : undefined}
      onKeyDown={onTap ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      } : undefined}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors",
          done ? "bg-success" : "bg-muted"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                done ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              {label}
            </p>
            {!done && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {detail}
              </p>
            )}
          </div>

          {/* Done indicator */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action area — stop propagation so clicks on children don't trigger onTap */}
        {children && !done && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

const GLASSES = 8;
const OZ_PER_GLASS = 16; // 8 × 16 = 128 oz

function WaterChecklist({
  waterOz,
  onWaterChange,
  isLast,
}: {
  waterOz: number;
  onWaterChange: (amount: number) => void;
  isLast: boolean;
}) {
  const glassesCompleted = Math.min(GLASSES, Math.floor(waterOz / OZ_PER_GLASS));
  const allDone = waterOz >= 128;

  const handleGlassTap = (glassIndex: number) => {
    const isChecked = glassIndex < glassesCompleted;
    if (isChecked) {
      // Unchecking: set water to this glass's starting amount
      const newOz = glassIndex * OZ_PER_GLASS;
      onWaterChange(newOz - waterOz);
    } else {
      // Checking: set water to include this glass
      const newOz = (glassIndex + 1) * OZ_PER_GLASS;
      onWaterChange(newOz - waterOz);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors",
        !isLast && "border-b border-border/50",
        allDone && "opacity-60"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors",
          allDone ? "bg-success" : "bg-muted"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                allDone ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              Water
            </p>
            {!allDone && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {waterOz} / 128 oz
              </p>
            )}
          </div>

          {/* Done indicator */}
          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 8 glass checklist */}
        {!allDone && (
          <div className="flex gap-2 mt-3">
            {Array.from({ length: GLASSES }).map((_, i) => {
              const checked = i < glassesCompleted;
              return (
                <button
                  key={i}
                  onClick={() => handleGlassTap(i)}
                  className={cn(
                    "w-8 h-8 rounded-md border text-xs font-medium transition-all",
                    "hover:scale-105 active:scale-95",
                    checked
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                  )}
                  title={`${(i + 1) * OZ_PER_GLASS} oz`}
                >
                  {checked ? <Check className="h-3.5 w-3.5 mx-auto" /> : i + 1}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const READING_BLOCKS = 4;
const MIN_PER_BLOCK = 5; // 4 × 5 = 20 min

function ReadingChecklist({
  readingMinutes,
  onReadingChange,
  isLast,
}: {
  readingMinutes: number;
  onReadingChange: (amount: number) => void;
  isLast: boolean;
}) {
  const blocksCompleted = Math.min(READING_BLOCKS, Math.floor(readingMinutes / MIN_PER_BLOCK));
  const allDone = readingMinutes >= 20;

  const handleBlockTap = (blockIndex: number) => {
    const isChecked = blockIndex < blocksCompleted;
    if (isChecked) {
      const newMin = blockIndex * MIN_PER_BLOCK;
      onReadingChange(newMin - readingMinutes);
    } else {
      const newMin = (blockIndex + 1) * MIN_PER_BLOCK;
      onReadingChange(newMin - readingMinutes);
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors",
        !isLast && "border-b border-border/50",
        allDone && "opacity-60"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors",
          allDone ? "bg-success" : "bg-muted"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                allDone ? "text-muted-foreground line-through" : "text-foreground"
              )}
            >
              Reading
            </p>
            {!allDone && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {readingMinutes} / 20 min
              </p>
            )}
          </div>

          {/* Done indicator */}
          <AnimatePresence>
            {allDone && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex-shrink-0"
              >
                <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                  <Check className="h-3 w-3 text-success-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 4 block checklist */}
        {!allDone && (
          <div className="flex gap-2 mt-3">
            {Array.from({ length: READING_BLOCKS }).map((_, i) => {
              const checked = i < blocksCompleted;
              return (
                <button
                  key={i}
                  onClick={() => handleBlockTap(i)}
                  className={cn(
                    "h-8 rounded-md border text-xs font-medium transition-all px-3",
                    "hover:scale-105 active:scale-95",
                    checked
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                  )}
                  title={`${(i + 1) * MIN_PER_BLOCK} min`}
                >
                  {checked ? <Check className="h-3.5 w-3.5 mx-auto" /> : `${(i + 1) * MIN_PER_BLOCK}m`}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkoutButton({
  challengeId,
  userId,
  dayNumber,
  date,
  workoutNumber,
  existingWorkout,
  label: buttonLabel,
  variant: buttonVariant,
  forceOutdoor,
}: {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  workoutNumber: 1 | 2;
  existingWorkout?: {
    type: string;
    name: string;
    durationMinutes: number;
    isOutdoor: boolean;
  };
  label?: string;
  variant?: "outline" | "ghost";
  forceOutdoor?: boolean;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(existingWorkout?.name ?? "");
  const [duration, setDuration] = useState(existingWorkout?.durationMinutes ?? 45);
  const isOutdoor = forceOutdoor ?? (existingWorkout?.isOutdoor ?? false);
  const [type, setType] = useState<string>(existingWorkout?.type ?? "strength");

  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const workoutData = {
        type: type as "strength" | "cardio" | "yoga" | "sports" | "other",
        name: name || `Workout ${workoutNumber}`,
        durationMinutes: duration,
        isOutdoor,
      };

      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        ...(workoutNumber === 1 ? { workout1: workoutData } : { workout2: workoutData }),
      });
      toast.success("Workout logged!");
      setShowForm(false);
    } catch {
      toast.error("Failed to save workout");
    } finally {
      setIsSaving(false);
    }
  };

  if (!showForm) {
    return (
      <Button
        variant={buttonVariant ?? "outline"}
        size="sm"
        onClick={() => setShowForm(true)}
      >
        {buttonLabel ?? (existingWorkout ? "Edit Workout" : "Log Workout")}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="space-y-3"
    >
      <div className="space-y-2">
        <Label htmlFor={`workout-name-${workoutNumber}`}>Workout Name</Label>
        <Input
          id={`workout-name-${workoutNumber}`}
          placeholder="e.g., Morning Run"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strength">Strength</SelectItem>
              <SelectItem value="cardio">Cardio</SelectItem>
              <SelectItem value="yoga">Yoga</SelectItem>
              <SelectItem value="sports">Sports</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`duration-${workoutNumber}`}>Duration (min)</Label>
          <Input
            id={`duration-${workoutNumber}`}
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            min={1}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          loading={isSaving}
          size="sm"
          className="flex-1"
        >
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
    </motion.div>
  );
}

function PhotoRow({
  challengeId,
  userId,
  dayNumber,
  date,
  hasPhoto,
}: {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  hasPhoto: boolean;
}) {
  const generateUploadUrl = useMutation(api.dailyLogs.generateUploadUrl);
  const updateLog = useMutation(api.dailyLogs.createOrUpdateDailyLog);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      await updateLog({
        challengeId,
        userId,
        dayNumber,
        date,
        progressPhotoId: storageId,
      });
      toast.success("Photo uploaded!");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-4 transition-colors",
        hasPhoto && "opacity-60"
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "w-[3px] rounded-full self-stretch min-h-[24px] transition-colors",
          hasPhoto ? "bg-success" : "bg-muted"
        )}
      />

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            hasPhoto ? "text-muted-foreground line-through" : "text-foreground"
          )}
        >
          Progress Photo
        </p>
        {!hasPhoto && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Take your daily photo
          </p>
        )}
      </div>

      {/* Upload button — right-aligned */}
      {hasPhoto ? (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex-shrink-0"
        >
          <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
            <Check className="h-3 w-3 text-success-foreground" />
          </div>
        </motion.div>
      ) : (
        <label
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-2 cursor-pointer",
            "rounded-lg border border-dashed border-primary/40 bg-primary/5",
            "px-3 py-2 text-xs font-medium text-primary",
            "hover:bg-primary/10 hover:border-primary/60 active:scale-95",
            "transition-all",
            isUploading && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Camera className="h-4 w-4" />
              Add Photo
            </>
          )}
        </label>
      )}
    </div>
  );
}
