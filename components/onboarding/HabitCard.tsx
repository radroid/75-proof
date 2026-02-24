"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dumbbell,
  Sun,
  Droplets,
  Apple,
  Ban,
  BookOpen,
  Camera,
  CircleDot,
  Hash,
} from "lucide-react";
import type { OnboardingHabit } from "@/lib/onboarding-types";

const iconMap: Record<string, React.ReactNode> = {
  dumbbell: <Dumbbell className="h-4 w-4" />,
  sun: <Sun className="h-4 w-4" />,
  droplets: <Droplets className="h-4 w-4" />,
  apple: <Apple className="h-4 w-4" />,
  ban: <Ban className="h-4 w-4" />,
  "book-open": <BookOpen className="h-4 w-4" />,
  camera: <Camera className="h-4 w-4" />,
};

interface HabitCardProps {
  habit: OnboardingHabit;
  mode: "readonly" | "toggle" | "full";
  onToggleActive?: (active: boolean) => void;
  onToggleHard?: (hard: boolean) => void;
  onRemove?: () => void;
}

export function HabitCard({
  habit,
  mode,
  onToggleActive,
  onToggleHard,
  onRemove,
}: HabitCardProps) {
  const icon = habit.icon ? iconMap[habit.icon] : (
    habit.blockType === "counter" ? <Hash className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />
  );

  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3 px-4 rounded-lg border transition-all",
        habit.isActive
          ? "border-border bg-card"
          : "border-border/50 bg-muted/30 opacity-60"
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
          habit.isActive
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {icon}
      </div>

      {/* Name + detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-sm font-medium truncate",
              !habit.isActive && "line-through text-muted-foreground"
            )}
          >
            {habit.name}
          </p>
          {habit.blockType === "counter" && habit.target && (
            <span className="text-xs text-muted-foreground">
              {habit.target} {habit.unit}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] h-4 px-1.5",
              habit.isHard
                ? "border-destructive/40 text-destructive"
                : "border-muted-foreground/30 text-muted-foreground"
            )}
          >
            {habit.isHard ? "Hard" : "Soft"}
          </Badge>
          <span className="text-[10px] text-muted-foreground capitalize">
            {habit.category}
          </span>
        </div>
      </div>

      {/* Controls */}
      {mode === "toggle" && (
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onToggleHard?.(!habit.isHard)}
            className={cn(
              "text-[10px] px-2.5 py-1.5 rounded border font-medium transition-colors min-h-[32px]",
              habit.isHard
                ? "border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/10"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            )}
          >
            {habit.isHard ? "Hard" : "Soft"}
          </button>
          <Switch
            checked={habit.isActive}
            onCheckedChange={(checked) => onToggleActive?.(checked)}
          />
        </div>
      )}

      {mode === "full" && (
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onToggleHard?.(!habit.isHard)}
            className={cn(
              "text-[10px] px-2.5 py-1.5 rounded border font-medium transition-colors min-h-[32px]",
              habit.isHard
                ? "border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/10"
                : "border-border text-muted-foreground hover:border-muted-foreground/50"
            )}
          >
            {habit.isHard ? "Hard" : "Soft"}
          </button>
          <Switch
            checked={habit.isActive}
            onCheckedChange={(checked) => onToggleActive?.(checked)}
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="text-xs text-destructive hover:text-destructive/80 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
