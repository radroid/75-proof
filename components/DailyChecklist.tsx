"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Dumbbell, Droplets, BookOpen, TreePine, Sparkles, Brain, Apple } from "lucide-react";
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

  const waterProgress = Math.min(100, ((dailyLog?.waterIntakeOz ?? 0) / 128) * 100);
  const readingProgress = Math.min(100, ((dailyLog?.readingMinutes ?? 0) / 20) * 100);

  const workout1Done = !!dailyLog?.workout1 && dailyLog.workout1.durationMinutes >= 45;
  const workout2Done = !!dailyLog?.workout2 && dailyLog.workout2.durationMinutes >= 45;

  const fitnessComplete =
    workout1Done && workout2Done && (dailyLog?.outdoorWorkoutCompleted ?? false);

  const fitnessCount = [
    workout1Done,
    workout2Done,
    dailyLog?.outdoorWorkoutCompleted ?? false,
  ].filter(Boolean).length;

  const nutritionComplete =
    (dailyLog?.waterIntakeOz ?? 0) >= 128 &&
    (dailyLog?.dietFollowed ?? false) &&
    (dailyLog?.noAlcohol ?? false);

  const nutritionCount = [
    (dailyLog?.waterIntakeOz ?? 0) >= 128,
    dailyLog?.dietFollowed ?? false,
    dailyLog?.noAlcohol ?? false,
  ].filter(Boolean).length;

  const mindProgressComplete =
    (dailyLog?.readingMinutes ?? 0) >= 20 &&
    !!dailyLog?.progressPhotoId;

  const mindProgressCount = [
    (dailyLog?.readingMinutes ?? 0) >= 20,
    !!dailyLog?.progressPhotoId,
  ].filter(Boolean).length;

  return (
    <>
      <Confetti isActive={confettiActive} />

      <div className="space-y-10">
        {/* Fitness Section */}
        <CategorySection
          title="Fitness"
          icon={<Dumbbell className="h-4 w-4" />}
          completedCount={fitnessCount}
          totalCount={3}
          isComplete={fitnessComplete}
        >
          <TodoItem
            label="Workout 1"
            detail={dailyLog?.workout1 ? `${dailyLog.workout1.name} — ${dailyLog.workout1.durationMinutes} min` : "45 minutes required"}
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
              />
            )}
          </TodoItem>

          <TodoItem
            label="Workout 2"
            detail={dailyLog?.workout2 ? `${dailyLog.workout2.name} — ${dailyLog.workout2.durationMinutes} min` : "45 minutes required"}
            done={workout2Done}
            onTap={workout2Done ? () => handleClearWorkout(2) : () => handleQuickWorkout(2)}
            isLast={false}
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
              />
            )}
          </TodoItem>

          <TodoItem
            label="Outdoor Workout"
            detail={dailyLog?.outdoorWorkoutCompleted ? "Fulfilled" : "One workout must be outside"}
            done={dailyLog?.outdoorWorkoutCompleted ?? false}
            isLast={true}
          >
            <p className="text-sm text-muted-foreground">
              {dailyLog?.outdoorWorkoutCompleted
                ? "Completed!"
                : "Mark a workout as outdoor above"}
            </p>
          </TodoItem>
        </CategorySection>

        {/* Nutrition Section */}
        <CategorySection
          title="Nutrition"
          icon={<Apple className="h-4 w-4" />}
          completedCount={nutritionCount}
          totalCount={3}
          isComplete={nutritionComplete}
        >
          <TodoItem
            label="Water Intake"
            detail={`${dailyLog?.waterIntakeOz ?? 0} / 128 oz`}
            done={(dailyLog?.waterIntakeOz ?? 0) >= 128}
            progress={waterProgress}
            isLast={false}
          >
            <div className="space-y-3">
              <Progress value={waterProgress} variant="gradient" showGlow className="h-1.5" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWaterChange(8)}
                  className="flex-1"
                >
                  +8 oz
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleWaterChange(16)}
                  className="flex-1"
                >
                  +16 oz
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleWaterChange(-8)}
                >
                  -8
                </Button>
              </div>
            </div>
          </TodoItem>

          <TodoItem
            label="Follow Diet"
            detail={dailyLog?.dietFollowed ? "Diet followed" : "Stick to your chosen diet"}
            done={dailyLog?.dietFollowed ?? false}
            onTap={() => handleToggle("dietFollowed", !dailyLog?.dietFollowed)}
            isLast={false}
          />

          <TodoItem
            label="No Alcohol"
            detail={dailyLog?.noAlcohol ? "Sobriety maintained" : "Stay alcohol-free"}
            done={dailyLog?.noAlcohol ?? false}
            onTap={() => handleToggle("noAlcohol", !dailyLog?.noAlcohol)}
            isLast={true}
          />
        </CategorySection>

        {/* Mind & Progress Section */}
        <CategorySection
          title="Mind & Progress"
          icon={<Brain className="h-4 w-4" />}
          completedCount={mindProgressCount}
          totalCount={2}
          isComplete={mindProgressComplete}
        >
          <TodoItem
            label="Reading"
            detail={`${dailyLog?.readingMinutes ?? 0} / 20 min (10 pages)`}
            done={(dailyLog?.readingMinutes ?? 0) >= 20}
            progress={readingProgress}
            isLast={false}
          >
            <div className="space-y-3">
              <Progress value={readingProgress} variant="gradient" showGlow className="h-1.5" />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReadingChange(5)}
                  className="flex-1"
                >
                  +5 min
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReadingChange(10)}
                  className="flex-1"
                >
                  +10 min
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleReadingChange(-5)}
                >
                  -5
                </Button>
              </div>
            </div>
          </TodoItem>

          <TodoItem
            label="Progress Photo"
            detail={dailyLog?.progressPhotoId ? "Photo captured" : "Take your daily photo"}
            done={!!dailyLog?.progressPhotoId}
            isLast={true}
          >
            <PhotoUpload
              challengeId={challengeId}
              userId={userId}
              dayNumber={dayNumber}
              date={date}
              hasPhoto={!!dailyLog?.progressPhotoId}
            />
          </TodoItem>
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
  completedCount,
  totalCount,
  isComplete,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-1 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="text-muted-foreground">{icon}</span>
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {title}
          </h3>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{totalCount}
          </span>
        </div>
        {isComplete && (
          <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px] h-5">
            <Check className="mr-1 h-2.5 w-2.5" />
            Complete
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
        "flex items-start gap-3 py-4",
        !isLast && "border-b border-border/50",
        onTap && "cursor-pointer hover:bg-muted/30 -mx-2 px-2 rounded-lg transition-colors"
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
          done ? "bg-primary" : "bg-muted"
        )}
      />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p
              className={cn(
                "text-sm font-medium transition-colors",
                done ? "text-muted-foreground" : "text-foreground"
              )}
            >
              {label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {detail}
            </p>
            {onTap && (
              <p className={cn("text-xs mt-1", done ? "text-muted-foreground" : "text-primary")}>
                {done ? "Tap to undo" : "Tap to complete"}
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
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action area — stop propagation so clicks on children don't trigger onTap */}
        {children && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            {children}
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
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState(existingWorkout?.name ?? "");
  const [duration, setDuration] = useState(existingWorkout?.durationMinutes ?? 45);
  const [isOutdoor, setIsOutdoor] = useState(existingWorkout?.isOutdoor ?? false);
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
      <div className="flex items-center space-x-2">
        <Checkbox
          id={`outdoor-${workoutNumber}`}
          checked={isOutdoor}
          onCheckedChange={(checked) => setIsOutdoor(checked as boolean)}
        />
        <Label htmlFor={`outdoor-${workoutNumber}`} className="text-sm font-normal">
          This is an outdoor workout
        </Label>
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

function PhotoUpload({
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
    <Button
      variant={hasPhoto ? "success" : "outline"}
      size="sm"
      asChild
    >
      <label className="cursor-pointer">
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={isUploading}
          className="hidden"
        />
        {isUploading ? (
          "Uploading..."
        ) : hasPhoto ? (
          <>
            <Check className="mr-1.5 h-3.5 w-3.5" /> Photo Uploaded
          </>
        ) : (
          "Upload Photo"
        )}
      </label>
    </Button>
  );
}
