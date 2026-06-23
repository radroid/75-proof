/**
 * Shared types for the after-work Plan feature. Kept dependency-free so the
 * pure logic, the data hooks, and the UI all speak the same vocabulary.
 */

export type BlockKind = "habit" | "break" | "custom" | "busy";
export type Placement = "timeline" | "anytime";

/** "HH:mm" 24h local time, e.g. "09:30". */
export type HHmm = string;

/** A habit as the Plan surface sees it (habit definition + today's completion). */
export interface PlanHabit {
  id: string; // habitDefinitionId (Convex Id or local string id)
  name: string;
  blockType: "task" | "counter";
  target?: number;
  unit?: string;
  isHard: boolean;
  category?: string;
  icon?: string;
  sortOrder: number;
  estimatedMinutes?: number; // stored override; heuristic default when absent
  defaultPlacement?: Placement; // stored override; inferred when absent
  completed: boolean; // derived from habitEntries for the day
}

/** A scheduled block on the timeline (placement only — completion lives in habitEntries). */
export interface PlanBlock {
  id: string;
  habitId?: string; // habitDefinitionId; undefined for break/custom/busy
  kind: BlockKind;
  title?: string; // for break/custom/busy; habit blocks read the habit name
  startMin: number; // minutes from local midnight
  durationMin: number;
  reminderEnabled: boolean;
  completed?: boolean; // derived for habit blocks; undefined otherwise
}

/** The user's saved "usual" schedule (lives on user preferences). */
export interface WorkSchedule {
  defaultStart: HHmm;
  defaultEnd: HHmm;
  windDownAt: HHmm;
  workdays: number[]; // 0=Sun … 6=Sat
}

/** Today's plan header (work window for the day). */
export interface DayPlanHeader {
  date: string; // YYYY-MM-DD
  workStart: HHmm | null;
  workEnd: HHmm | null;
  windDownAt: HHmm;
  arrangedAt?: number;
}
