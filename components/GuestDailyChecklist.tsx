"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Dumbbell, Sparkles, Brain, Apple, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DEMO_DAILY_LOG } from "@/lib/demo-data";
import { useGuest } from "@/components/guest-provider";

interface DayLog {
  workout1?: { name: string; durationMinutes: number } | null;
  workout2?: { name: string; durationMinutes: number } | null;
  waterIntakeOz: number;
  dietFollowed: boolean;
  noAlcohol: boolean;
  readingMinutes: number;
  progressPhotoId?: string | null;
}

interface GuestDailyChecklistProps {
  dayNumber: number;
  isEditable?: boolean;
  /** The demo log for the current day — drives initial checklist state. */
  log?: DayLog | null;
  onCompletionChange?: (totalDone: number) => void;
}

export function GuestDailyChecklist({ dayNumber, isEditable = true, log, onCompletionChange }: GuestDailyChecklistProps) {
  const { promptSignup } = useGuest();

  // Use provided log (per-day), fall back to DEMO_DAILY_LOG for backward compat
  const sourceLog = log ?? DEMO_DAILY_LOG;

  const [workout1Done, setWorkout1Done] = useState(!!sourceLog.workout1);
  const [workout2Done, setWorkout2Done] = useState(!!sourceLog.workout2);
  const [waterOz, setWaterOz] = useState(sourceLog.waterIntakeOz);
  const [dietFollowed, setDietFollowed] = useState(sourceLog.dietFollowed);
  const [noAlcohol, setNoAlcohol] = useState(sourceLog.noAlcohol);
  const [readingMinutes, setReadingMinutes] = useState(sourceLog.readingMinutes);
  const [hasPhoto, setHasPhoto] = useState(!!sourceLog.progressPhotoId);
  const [showSignupDialog, setShowSignupDialog] = useState(false);

  const fitnessComplete = workout1Done && workout2Done;
  const nutritionComplete = waterOz >= 128 && dietFollowed && noAlcohol;
  const mindProgressComplete = readingMinutes >= 20 && hasPhoto;
  const allComplete = fitnessComplete && nutritionComplete && mindProgressComplete;

  // Compute totalDone matching the 8-item structure used by themed dashboards
  const totalDone = [
    workout1Done,
    workout2Done,
    workout1Done || workout2Done, // outdoorWorkoutCompleted
    waterOz >= 128,
    dietFollowed,
    noAlcohol,
    readingMinutes >= 20,
    hasPhoto,
  ].filter(Boolean).length;

  // Report completion changes to parent
  useEffect(() => {
    onCompletionChange?.(totalDone);
  }, [totalDone, onCompletionChange]);

  // Show signup dialog when all tasks completed for the first time
  const hasShownDialog = useRef(false);
  useEffect(() => {
    if (allComplete && !hasShownDialog.current) {
      hasShownDialog.current = true;
      // Small delay so the user sees the completion animation first
      const timer = setTimeout(() => setShowSignupDialog(true), 800);
      return () => clearTimeout(timer);
    }
  }, [allComplete]);

  // Water grid
  const GLASSES = 8;
  const OZ_PER_GLASS = 16;
  const glassesCompleted = Math.min(GLASSES, Math.floor(waterOz / OZ_PER_GLASS));

  const handleGlassTap = (i: number) => {
    if (!isEditable) return;
    if (i < glassesCompleted) {
      setWaterOz(i * OZ_PER_GLASS);
    } else {
      setWaterOz((i + 1) * OZ_PER_GLASS);
    }
  };

  // Reading grid
  const READING_BLOCKS = 4;
  const MIN_PER_BLOCK = 5;
  const blocksCompleted = Math.min(READING_BLOCKS, Math.floor(readingMinutes / MIN_PER_BLOCK));

  const handleBlockTap = (i: number) => {
    if (!isEditable) return;
    if (i < blocksCompleted) {
      setReadingMinutes(i * MIN_PER_BLOCK);
    } else {
      setReadingMinutes((i + 1) * MIN_PER_BLOCK);
    }
  };

  return (
    <>
      <div className="space-y-10">
        {/* Fitness Section */}
        <CategorySection title="Fitness" icon={<Dumbbell className="h-4 w-4" />} isComplete={fitnessComplete}>
          <TodoItem
            label="Indoor Workout"
            detail={workout1Done ? "Morning Run — 45 min" : "45 min"}
            done={workout1Done}
            onTap={() => isEditable && setWorkout1Done(!workout1Done)}
            isLast={false}
            disabled={!isEditable}
          />
          <TodoItem
            label="Outdoor Workout"
            detail={workout2Done ? "Weight Training — 45 min" : "45 min, must be outside"}
            done={workout2Done}
            onTap={() => isEditable && setWorkout2Done(!workout2Done)}
            isLast={true}
            disabled={!isEditable}
          />
        </CategorySection>

        {/* Nutrition Section */}
        <CategorySection title="Nutrition" icon={<Apple className="h-4 w-4" />} isComplete={nutritionComplete}>
          {/* Water row */}
          <div className={cn("flex items-start gap-3 py-4 transition-colors border-b border-border/50", waterOz >= 128 && "opacity-60")}>
            <div className={cn("w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors", waterOz >= 128 ? "bg-success" : "bg-muted")} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn("text-sm font-medium transition-colors", waterOz >= 128 ? "text-muted-foreground line-through" : "text-foreground")}>Water</p>
                  {waterOz < 128 && <p className="text-xs text-muted-foreground mt-0.5">{waterOz} / 128 oz</p>}
                </div>
                <DoneIndicator done={waterOz >= 128} />
              </div>
              {waterOz < 128 && (
                <div className="flex gap-2 mt-3">
                  {Array.from({ length: GLASSES }).map((_, i) => {
                    const checked = i < glassesCompleted;
                    return (
                      <button
                        key={i}
                        onClick={() => handleGlassTap(i)}
                        disabled={!isEditable}
                        className={cn(
                          "w-8 h-8 rounded-md border text-xs font-medium transition-all",
                          isEditable && "hover:scale-105 active:scale-95",
                          !isEditable && "cursor-not-allowed opacity-50",
                          checked ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {checked ? <Check className="h-3.5 w-3.5 mx-auto" /> : i + 1}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <TodoItem label="Follow Diet" detail="No cheat meals" done={dietFollowed} onTap={() => isEditable && setDietFollowed(!dietFollowed)} isLast={false} disabled={!isEditable} />
          <TodoItem label="No Alcohol" detail="Stay alcohol-free" done={noAlcohol} onTap={() => isEditable && setNoAlcohol(!noAlcohol)} isLast={true} disabled={!isEditable} />
        </CategorySection>

        {/* Mind & Progress Section */}
        <CategorySection title="Mind & Progress" icon={<Brain className="h-4 w-4" />} isComplete={mindProgressComplete}>
          {/* Reading row */}
          <div className={cn("flex items-start gap-3 py-4 transition-colors border-b border-border/50", readingMinutes >= 20 && "opacity-60")}>
            <div className={cn("w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors", readingMinutes >= 20 ? "bg-success" : "bg-muted")} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={cn("text-sm font-medium transition-colors", readingMinutes >= 20 ? "text-muted-foreground line-through" : "text-foreground")}>Reading</p>
                  {readingMinutes < 20 && <p className="text-xs text-muted-foreground mt-0.5">{readingMinutes} / 20 min</p>}
                </div>
                <DoneIndicator done={readingMinutes >= 20} />
              </div>
              {readingMinutes < 20 && (
                <div className="flex gap-2 mt-3">
                  {Array.from({ length: READING_BLOCKS }).map((_, i) => {
                    const checked = i < blocksCompleted;
                    return (
                      <button
                        key={i}
                        onClick={() => handleBlockTap(i)}
                        disabled={!isEditable}
                        className={cn(
                          "h-8 rounded-md border text-xs font-medium transition-all px-3",
                          isEditable && "hover:scale-105 active:scale-95",
                          !isEditable && "cursor-not-allowed opacity-50",
                          checked ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >
                        {checked ? <Check className="h-3.5 w-3.5 mx-auto" /> : `${(i + 1) * MIN_PER_BLOCK}m`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Photo row */}
          <div className={cn("flex items-center gap-3 py-4 transition-colors", hasPhoto && "opacity-60")}>
            <div className={cn("w-[3px] rounded-full self-stretch min-h-[24px] transition-colors", hasPhoto ? "bg-success" : "bg-muted")} />
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium transition-colors", hasPhoto ? "text-muted-foreground line-through" : "text-foreground")}>Progress Photo</p>
              {!hasPhoto && <p className="text-xs text-muted-foreground mt-0.5">Take your daily photo</p>}
            </div>
            {hasPhoto ? (
              <DoneIndicator done={true} />
            ) : (
              <button
                onClick={() => isEditable && setHasPhoto(true)}
                disabled={!isEditable}
                className={cn(
                  "flex-shrink-0 inline-flex items-center gap-2",
                  "rounded-lg border border-dashed border-primary/40 bg-primary/5",
                  "px-3 py-2 text-xs font-medium text-primary",
                  isEditable && "hover:bg-primary/10 hover:border-primary/60 active:scale-95",
                  !isEditable && "cursor-not-allowed opacity-50",
                  "transition-all"
                )}
              >
                <Camera className="h-4 w-4" />
                Add Photo
              </button>
            )}
          </div>
        </CategorySection>

        {/* All requirements status */}
        <AnimatePresence>
          {allComplete && (
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

      {/* Signup dialog on all-complete */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-2"
            >
              <Sparkles className="h-8 w-8 text-success" />
            </motion.div>
            <DialogTitle className="text-xl">You just crushed it.</DialogTitle>
            <DialogDescription className="text-base">
              Imagine doing this for real — 75 days, a completely different you. Start tracking your actual progress.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <Button onClick={() => { setShowSignupDialog(false); promptSignup(); }} size="lg">
              Start My Challenge — Free
            </Button>
            <button
              onClick={() => setShowSignupDialog(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Keep exploring
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CategorySection({ title, icon, isComplete, children }: { title: string; icon: React.ReactNode; isComplete: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 pb-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className={cn("transition-colors", isComplete ? "text-success" : "text-muted-foreground")}>{icon}</span>
          <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">{title}</h3>
        </div>
        {isComplete && (
          <Badge variant="outline" className="border-success text-success bg-success/10 text-[10px] h-5">
            <Check className="mr-1 h-2.5 w-2.5" />
            Done
          </Badge>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function TodoItem({ label, detail, done, onTap, isLast, disabled = false }: { label: string; detail: string; done: boolean; isLast: boolean; onTap: () => void; disabled?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 py-4 transition-colors -mx-2 px-2 rounded-lg",
        !isLast && "border-b border-border/50",
        done && "opacity-60",
        disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-muted/30"
      )}
      onClick={disabled ? undefined : onTap}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      onKeyDown={disabled ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onTap(); } }}
    >
      <div className={cn("w-[3px] rounded-full self-stretch mt-0.5 min-h-[24px] transition-colors", done ? "bg-success" : "bg-muted")} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={cn("text-sm font-medium transition-colors", done ? "text-muted-foreground line-through" : "text-foreground")}>{label}</p>
            {!done && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
          </div>
          <DoneIndicator done={done} />
        </div>
      </div>
    </div>
  );
}

function DoneIndicator({ done }: { done: boolean }) {
  return (
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
  );
}
