"use client";

import { useRef, useState } from "react";
import { Bell, BellOff, Check, GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, formatDuration, snapTo5 } from "@/lib/plan/time";
import type { PlanBlock, PlanHabit } from "@/lib/plan/types";

const PX_PER_MIN = 1.1;
const HOUR = 60;
const MIN_BLOCK_MIN = 5;
const VISUAL_MIN_PX = 44; // smallest card that still fits a label

interface Props {
  blocks: PlanBlock[];
  habitsById: Map<string, PlanHabit>;
  nowMin: number;
  workEndMin: number | null;
  windDownMin: number;
  onToggleDone: (habit: PlanHabit) => void;
  onRemoveBlock: (blockId: string) => void;
  onToggleReminder: (blockId: string, enabled: boolean) => void;
  onMove: (blockId: string, startMin: number) => void;
  onResize: (blockId: string, startMin: number, durationMin: number) => void;
}

/**
 * Proportional canvas of the after-work window. Blocks are positioned by clock
 * time; the grip drags to re-time, the bottom edge drags to resize, both
 * snapping to a 5-minute grid. Faithful to direction B (zoom into the evening).
 */
export function PlanTimeline({
  blocks,
  habitsById,
  nowMin,
  workEndMin,
  windDownMin,
  onToggleDone,
  onRemoveBlock,
  onToggleReminder,
  onMove,
  onResize,
}: Props) {
  const starts = blocks.map((b) => b.startMin);
  const ends = blocks.map((b) => b.startMin + b.durationMin);
  const anchor = workEndMin ?? nowMin;

  let winStart = Math.floor(Math.min(anchor, nowMin, ...starts) / HOUR) * HOUR;
  let winEnd = Math.ceil(Math.max(windDownMin, nowMin, ...ends) / HOUR) * HOUR;
  if (winEnd - winStart < 180) winEnd = winStart + 180; // keep a usable height
  winStart = Math.max(0, winStart);

  const yFor = (min: number) => (min - winStart) * PX_PER_MIN;
  const height = (winEnd - winStart) * PX_PER_MIN;

  const hours: number[] = [];
  for (let h = winStart; h <= winEnd; h += HOUR) hours.push(h);

  const GUTTER = 52;
  const showNow = nowMin >= winStart && nowMin <= winEnd;

  return (
    <div className="relative" style={{ height }}>
      {/* Hour gridlines + labels */}
      {hours.map((h) => (
        <div
          key={h}
          className="absolute inset-x-0 flex items-center"
          style={{ top: yFor(h) }}
          aria-hidden
        >
          <span
            className="text-right pr-2 text-[10px] text-muted-foreground tabular-nums -mt-1.5"
            style={{ width: GUTTER }}
          >
            {formatClock(h)}
          </span>
          <span className="flex-1 border-t border-border/50" />
        </div>
      ))}

      {/* Now line */}
      {showNow && (
        <div
          className="absolute inset-x-0 z-20 flex items-center pointer-events-none"
          style={{ top: yFor(nowMin) }}
        >
          <span
            className="text-right pr-2 text-[10px] font-medium text-primary tabular-nums -mt-1.5"
            style={{ width: GUTTER }}
          >
            {formatClock(nowMin)}
          </span>
          <span className="h-px flex-1 bg-primary/70" />
          <span className="pl-1 pr-0.5 text-[9px] font-semibold tracking-wide text-primary">
            NOW
          </span>
        </div>
      )}

      {/* Blocks */}
      {blocks.map((block) => (
        <CanvasBlock
          key={block.id}
          block={block}
          habit={block.habitId ? habitsById.get(block.habitId) : undefined}
          px={PX_PER_MIN}
          gutter={GUTTER}
          winStartMin={winStart}
          winEndMin={winEnd}
          yFor={yFor}
          onToggleDone={onToggleDone}
          onRemoveBlock={onRemoveBlock}
          onToggleReminder={onToggleReminder}
          onMove={onMove}
          onResize={onResize}
        />
      ))}
    </div>
  );
}

interface BlockProps {
  block: PlanBlock;
  habit?: PlanHabit;
  px: number;
  gutter: number;
  winStartMin: number;
  winEndMin: number;
  yFor: (min: number) => number;
  onToggleDone: (habit: PlanHabit) => void;
  onRemoveBlock: (blockId: string) => void;
  onToggleReminder: (blockId: string, enabled: boolean) => void;
  onMove: (blockId: string, startMin: number) => void;
  onResize: (blockId: string, startMin: number, durationMin: number) => void;
}

function CanvasBlock({
  block,
  habit,
  px,
  gutter,
  winStartMin,
  winEndMin,
  yFor,
  onToggleDone,
  onRemoveBlock,
  onToggleReminder,
  onMove,
  onResize,
}: BlockProps) {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    mode: "move" | "resize";
    startY: number;
    origStart: number;
    origDur: number;
    moved: boolean;
  } | null>(null);
  const [live, setLive] = useState<{ start: number; dur: number } | null>(null);

  const start = live?.start ?? block.startMin;
  const dur = live?.dur ?? block.durationMin;
  const top = yFor(start);
  const visualHeight = Math.max(VISUAL_MIN_PX, dur * px);

  const done = !!habit?.completed;
  const name = habit?.name ?? block.title ?? "Block";
  const isHabit = block.kind === "habit" && !!habit;

  function beginDrag(mode: "move" | "resize", e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    outerRef.current?.setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      startY: e.clientY,
      origStart: block.startMin,
      origDur: block.durationMin,
      moved: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    if (Math.abs(e.clientY - d.startY) > 3) d.moved = true;
    const deltaMin = (e.clientY - d.startY) / px;
    if (d.mode === "move") {
      let ns = snapTo5(d.origStart + deltaMin);
      ns = Math.max(winStartMin, Math.min(ns, winEndMin - d.origDur));
      setLive({ start: ns, dur: d.origDur });
    } else {
      let nd = snapTo5(d.origDur + deltaMin);
      nd = Math.max(MIN_BLOCK_MIN, Math.min(nd, winEndMin - d.origStart));
      setLive({ start: d.origStart, dur: nd });
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    const d = dragRef.current;
    dragRef.current = null;
    if (outerRef.current?.hasPointerCapture(e.pointerId)) {
      outerRef.current.releasePointerCapture(e.pointerId);
    }
    const cur = live;
    setLive(null);
    if (!d || !d.moved || !cur) return;
    if (d.mode === "move" && cur.start !== block.startMin) {
      onMove(block.id, cur.start);
    } else if (d.mode === "resize" && cur.dur !== block.durationMin) {
      onResize(block.id, block.startMin, cur.dur);
    }
  }

  return (
    <div
      ref={outerRef}
      className="absolute z-10"
      style={{ top, left: gutter, right: 0, height: visualHeight }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className={cn(
          "relative h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm",
          live && "ring-2 ring-primary/40",
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
        <div className="flex h-full items-start gap-2 pl-2.5 pr-1.5 py-2">
          {/* Completion toggle */}
          {isHabit ? (
            <button
              type="button"
              onClick={() => habit && onToggleDone(habit)}
              aria-label={done ? `Mark ${name} not done` : `Mark ${name} done`}
              aria-pressed={done}
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                done
                  ? "border-success bg-success"
                  : "border-muted-foreground/40 bg-background hover:border-foreground",
              )}
            >
              {done && (
                <Check
                  className="h-2.5 w-2.5 text-success-foreground"
                  aria-hidden
                />
              )}
            </button>
          ) : (
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-muted-foreground/30" />
          )}

          <div className="min-w-0 flex-1">
            <div
              className={cn(
                "text-sm font-medium text-foreground truncate",
                done && "line-through text-muted-foreground",
              )}
            >
              {habit?.icon ? `${habit.icon} ` : ""}
              {name}
            </div>
            <div className="text-[11px] text-muted-foreground truncate">
              {formatClock(start)} – {formatClock(start + dur)} ·{" "}
              {formatDuration(dur)}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {isHabit && (
              <button
                type="button"
                onClick={() => onToggleReminder(block.id, !block.reminderEnabled)}
                aria-label={
                  block.reminderEnabled
                    ? "Turn reminder off"
                    : "Turn reminder on"
                }
                className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            {/* Move handle */}
            <button
              type="button"
              aria-label={`Drag to move ${name}`}
              onPointerDown={(e) => beginDrag("move", e)}
              className="cursor-grab touch-none rounded-md p-1 text-muted-foreground/70 hover:bg-muted/50 hover:text-foreground active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <GripVertical className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Resize handle (bottom edge) */}
        <div
          role="separator"
          aria-label={`Drag to resize ${name}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            beginDrag("resize", e);
          }}
          className="absolute inset-x-0 bottom-0 h-3 cursor-ns-resize touch-none"
        >
          <span className="mx-auto mt-1.5 block h-1 w-8 rounded-full bg-muted-foreground/25" />
        </div>
      </div>
    </div>
  );
}
