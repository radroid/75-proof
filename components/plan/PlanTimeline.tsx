"use client";

import { Bell, BellOff, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, formatDuration } from "@/lib/plan/time";
import type { PlanBlock, PlanHabit } from "@/lib/plan/types";

interface Props {
  blocks: PlanBlock[];
  habitsById: Map<string, PlanHabit>;
  nowMin: number;
  onToggleDone: (habit: PlanHabit) => void;
  onRemoveBlock: (blockId: string) => void;
  onToggleReminder: (blockId: string, enabled: boolean) => void;
}

export function PlanTimeline({
  blocks,
  habitsById,
  nowMin,
  onToggleDone,
  onRemoveBlock,
  onToggleReminder,
}: Props) {
  const sorted = [...blocks].sort((a, b) => a.startMin - b.startMin);
  // Insert the "now" marker before the first block at/after the current time.
  const nowIndex = sorted.findIndex((b) => b.startMin >= nowMin);
  const insertAt = nowIndex === -1 ? sorted.length : nowIndex;

  return (
    <div className="relative">
      {/* Spine */}
      <div className="absolute top-1 bottom-1 left-[65px] w-px bg-border" aria-hidden />

      {sorted.map((block, i) => (
        <div key={block.id}>
          {i === insertAt && <NowRow nowMin={nowMin} />}
          <BlockRow
            block={block}
            habit={block.habitId ? habitsById.get(block.habitId) : undefined}
            onToggleDone={onToggleDone}
            onRemoveBlock={onRemoveBlock}
            onToggleReminder={onToggleReminder}
          />
        </div>
      ))}
      {insertAt === sorted.length && <NowRow nowMin={nowMin} />}
    </div>
  );
}

function NowRow({ nowMin }: { nowMin: number }) {
  return (
    <div className="grid grid-cols-[44px_20px_1fr] gap-x-3 items-center py-1.5">
      <span className="text-right text-[11px] font-medium text-primary tabular-nums">
        {formatClock(nowMin)}
      </span>
      <span className="flex justify-center">
        <span className="h-2 w-2 rounded-full bg-primary ring-4 ring-primary/15" />
      </span>
      <span className="flex items-center gap-2">
        <span className="h-px flex-1 bg-gradient-to-r from-primary to-transparent" />
        <span className="text-[10px] font-semibold tracking-wide text-primary">
          NOW
        </span>
      </span>
    </div>
  );
}

function BlockRow({
  block,
  habit,
  onToggleDone,
  onRemoveBlock,
  onToggleReminder,
}: {
  block: PlanBlock;
  habit?: PlanHabit;
  onToggleDone: (habit: PlanHabit) => void;
  onRemoveBlock: (blockId: string) => void;
  onToggleReminder: (blockId: string, enabled: boolean) => void;
}) {
  const done = !!habit?.completed;
  const name = habit?.name ?? block.title ?? "Block";
  const isHabit = block.kind === "habit" && !!habit;

  return (
    <div className="grid grid-cols-[44px_20px_1fr] gap-x-3 items-start py-1.5">
      <span className="pt-3 text-right text-[11px] text-muted-foreground tabular-nums">
        {formatClock(block.startMin)}
      </span>

      {/* Node — doubles as the completion toggle for habit blocks */}
      <span className="flex justify-center pt-3">
        {isHabit ? (
          <button
            type="button"
            onClick={() => habit && onToggleDone(habit)}
            aria-label={done ? `Mark ${name} not done` : `Mark ${name} done`}
            aria-pressed={done}
            className={cn(
              "h-4 w-4 rounded-full border-2 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              done
                ? "border-success bg-success ring-4 ring-success/15"
                : "border-muted-foreground/40 bg-background hover:border-foreground",
            )}
          >
            {done && (
              <Check className="h-2.5 w-2.5 text-success-foreground" aria-hidden />
            )}
          </button>
        ) : (
          <span className="mt-0.5 h-3 w-3 rounded-full border-2 border-muted-foreground/30 bg-background" />
        )}
      </span>

      {/* Card */}
      <div
        className={cn(
          "relative overflow-hidden rounded-xl border border-border bg-card/60 px-3 py-2.5",
          done && "opacity-60",
        )}
      >
        <span
          className={cn(
            "absolute inset-y-0 left-0 w-[3px]",
            done ? "bg-success/50" : "bg-success",
          )}
          aria-hidden
        />
        <div className="flex items-start justify-between gap-2 pl-1.5">
          <div className="min-w-0">
            <div
              className={cn(
                "text-sm font-medium text-foreground truncate",
                done && "line-through text-muted-foreground",
              )}
            >
              {habit?.icon ? `${habit.icon} ` : ""}
              {name}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {formatClock(block.startMin)} – {formatClock(block.startMin + block.durationMin)} ·{" "}
              {formatDuration(block.durationMin)}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            {isHabit && (
              <button
                type="button"
                onClick={() =>
                  onToggleReminder(block.id, !block.reminderEnabled)
                }
                aria-label={
                  block.reminderEnabled ? "Turn reminder off" : "Turn reminder on"
                }
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {block.reminderEnabled ? (
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <BellOff className="h-3.5 w-3.5" aria-hidden />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => onRemoveBlock(block.id)}
              aria-label={`Remove ${name}`}
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
