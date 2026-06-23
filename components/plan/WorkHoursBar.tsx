"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatClock, hhmmToMin } from "@/lib/plan/time";

export interface WorkHoursSave {
  workStart: string | null;
  workEnd: string | null;
  windDownAt: string;
  saveAsDefault: boolean;
}

interface Props {
  workStart: string | null;
  workEnd: string | null;
  windDownAt: string;
  hasSchedule: boolean;
  /** Open the editor immediately (used by the first-run flow). */
  startOpen?: boolean;
  onSave: (next: WorkHoursSave) => void;
}

function clockLabel(hhmm: string | null): string {
  return hhmm ? formatClock(hhmmToMin(hhmm)) : "";
}

export function WorkHoursBar({
  workStart,
  workEnd,
  windDownAt,
  hasSchedule,
  startOpen = false,
  onSave,
}: Props) {
  const [open, setOpen] = useState(startOpen);
  const [noWork, setNoWork] = useState(workStart === null);
  const [start, setStart] = useState(workStart ?? "09:00");
  const [end, setEnd] = useState(workEnd ?? "17:30");
  const [wind, setWind] = useState(windDownAt);
  const [saveDefault, setSaveDefault] = useState(!hasSchedule);

  // Re-seed the editor whenever the underlying values change (e.g. plan loads).
  useEffect(() => {
    setNoWork(workStart === null);
    setStart(workStart ?? "09:00");
    setEnd(workEnd ?? "17:30");
    setWind(windDownAt);
  }, [workStart, workEnd, windDownAt]);

  const summary =
    workStart && workEnd
      ? `${clockLabel(workStart)} – ${clockLabel(workEnd)}`
      : "No work today";

  function handleSave() {
    onSave({
      workStart: noWork ? null : start,
      workEnd: noWork ? null : end,
      windDownAt: wind,
      saveAsDefault: saveDefault,
    });
    setOpen(false);
  }

  return (
    <div className="rounded-xl border border-border bg-card/60">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          <Briefcase className="h-4 w-4 text-muted-foreground" aria-hidden />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Work
          </div>
          <div className="text-sm text-foreground truncate">{summary}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
        >
          {open ? "Close" : "Edit"}
        </Button>
      </div>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">I’m off today</span>
            <Switch checked={noWork} onCheckedChange={setNoWork} />
          </label>

          {!noWork && (
            <div className="grid grid-cols-2 gap-3">
              <TimeField label="Start" value={start} onChange={setStart} />
              <TimeField label="End" value={end} onChange={setEnd} />
            </div>
          )}

          <TimeField
            label="Wind down by"
            value={wind}
            onChange={setWind}
            hint="End of your usable evening"
          />

          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-foreground">Save as my usual</span>
            <Switch checked={saveDefault} onCheckedChange={setSaveDefault} />
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimeField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2",
          "text-sm text-foreground tabular-nums",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      />
      {hint && (
        <span className="mt-1 block text-[11px] text-muted-foreground">
          {hint}
        </span>
      )}
    </label>
  );
}
