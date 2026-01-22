"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Dumbbell, Droplets, BookOpen, Utensils, Wine, Camera, TreePine } from "lucide-react";
import { toast } from "sonner";

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Today&apos;s Checklist</h2>
        {dailyLog?.allRequirementsMet && (
          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
            <Check className="mr-1 h-3 w-3" /> All Complete
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Workout 1 */}
        <ChecklistCard
          title="Workout 1"
          icon={<Dumbbell className="h-5 w-5" />}
          completed={!!dailyLog?.workout1 && dailyLog.workout1.durationMinutes >= 45}
          subtitle={dailyLog?.workout1 ? `${dailyLog.workout1.name} - ${dailyLog.workout1.durationMinutes} min` : "45 minutes required"}
        >
          <WorkoutButton
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            workoutNumber={1}
            existingWorkout={dailyLog?.workout1}
          />
        </ChecklistCard>

        {/* Workout 2 */}
        <ChecklistCard
          title="Workout 2"
          icon={<Dumbbell className="h-5 w-5" />}
          completed={!!dailyLog?.workout2 && dailyLog.workout2.durationMinutes >= 45}
          subtitle={dailyLog?.workout2 ? `${dailyLog.workout2.name} - ${dailyLog.workout2.durationMinutes} min` : "45 minutes required"}
        >
          <WorkoutButton
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            workoutNumber={2}
            existingWorkout={dailyLog?.workout2}
          />
        </ChecklistCard>

        {/* Outdoor Workout */}
        <ChecklistCard
          title="Outdoor Workout"
          icon={<TreePine className="h-5 w-5" />}
          completed={dailyLog?.outdoorWorkoutCompleted ?? false}
          subtitle="One workout must be outside"
        >
          <p className="text-sm text-muted-foreground">
            {dailyLog?.outdoorWorkoutCompleted
              ? "Completed!"
              : "Mark a workout as outdoor above"}
          </p>
        </ChecklistCard>

        {/* Water Intake */}
        <ChecklistCard
          title="Water Intake"
          icon={<Droplets className="h-5 w-5 text-blue-500" />}
          completed={(dailyLog?.waterIntakeOz ?? 0) >= 128}
          subtitle={`${dailyLog?.waterIntakeOz ?? 0} / 128 oz`}
        >
          <div className="space-y-3">
            <Progress value={waterProgress} className="h-2" />
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
        </ChecklistCard>

        {/* Reading */}
        <ChecklistCard
          title="Reading"
          icon={<BookOpen className="h-5 w-5 text-amber-500" />}
          completed={(dailyLog?.readingMinutes ?? 0) >= 20}
          subtitle={`${dailyLog?.readingMinutes ?? 0} / 20 min (10 pages)`}
        >
          <div className="space-y-3">
            <Progress value={readingProgress} className="h-2" />
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
        </ChecklistCard>

        {/* Diet */}
        <ChecklistCard
          title="Follow Diet"
          icon={<Utensils className="h-5 w-5 text-green-500" />}
          completed={dailyLog?.dietFollowed ?? false}
          subtitle="Stick to your chosen diet"
        >
          <Button
            variant={dailyLog?.dietFollowed ? "default" : "outline"}
            className={dailyLog?.dietFollowed ? "w-full bg-emerald-500 hover:bg-emerald-600" : "w-full"}
            onClick={() => handleToggle("dietFollowed", !dailyLog?.dietFollowed)}
          >
            {dailyLog?.dietFollowed ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Completed
              </>
            ) : (
              "Mark Complete"
            )}
          </Button>
        </ChecklistCard>

        {/* No Alcohol */}
        <ChecklistCard
          title="No Alcohol"
          icon={<Wine className="h-5 w-5 text-red-500" />}
          completed={dailyLog?.noAlcohol ?? false}
          subtitle="Stay alcohol-free"
        >
          <Button
            variant={dailyLog?.noAlcohol ? "default" : "outline"}
            className={dailyLog?.noAlcohol ? "w-full bg-emerald-500 hover:bg-emerald-600" : "w-full"}
            onClick={() => handleToggle("noAlcohol", !dailyLog?.noAlcohol)}
          >
            {dailyLog?.noAlcohol ? (
              <>
                <Check className="mr-2 h-4 w-4" /> Completed
              </>
            ) : (
              "Mark Complete"
            )}
          </Button>
        </ChecklistCard>

        {/* Progress Photo */}
        <ChecklistCard
          title="Progress Photo"
          icon={<Camera className="h-5 w-5 text-purple-500" />}
          completed={!!dailyLog?.progressPhotoId}
          subtitle="Take your daily photo"
        >
          <PhotoUpload
            challengeId={challengeId}
            userId={userId}
            dayNumber={dayNumber}
            date={date}
            hasPhoto={!!dailyLog?.progressPhotoId}
          />
        </ChecklistCard>
      </div>

      {/* All requirements status */}
      {dailyLog?.allRequirementsMet && (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20">
          <CardContent className="pt-6 text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="text-lg font-semibold text-emerald-700 dark:text-emerald-400">
              All requirements completed for today!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ChecklistCard({
  title,
  icon,
  completed,
  subtitle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  completed: boolean;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={completed ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base">{title}</CardTitle>
          </div>
          {completed && (
            <Badge variant="outline" className="border-emerald-500 text-emerald-600">
              <Check className="mr-1 h-3 w-3" />
              Done
            </Badge>
          )}
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function WorkoutButton({
  challengeId,
  userId,
  dayNumber,
  date,
  workoutNumber,
  existingWorkout,
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
        variant="outline"
        className="w-full"
        onClick={() => setShowForm(true)}
      >
        {existingWorkout ? "Edit Workout" : "Log Workout"}
      </Button>
    );
  }

  return (
    <div className="space-y-3">
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
          disabled={isSaving}
          className="flex-1"
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowForm(false)}
        >
          Cancel
        </Button>
      </div>
    </div>
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
      variant={hasPhoto ? "default" : "outline"}
      className={hasPhoto ? "w-full bg-emerald-500 hover:bg-emerald-600" : "w-full"}
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
            <Check className="mr-2 h-4 w-4" /> Photo Uploaded
          </>
        ) : (
          "Upload Photo"
        )}
      </label>
    </Button>
  );
}
