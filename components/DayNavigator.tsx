"use client";

import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateShort, isDayEditable } from "@/lib/day-utils";

interface DayNavigatorProps {
  selectedDayNumber: number;
  todayDayNumber: number;
  startDate: string;
  onDayChange: (day: number) => void;
  /** Override date string (formatted) shown below the day label. */
  dateStr?: string;
}

export function DayNavigator({
  selectedDayNumber,
  todayDayNumber,
  startDate,
  onDayChange,
  dateStr,
}: DayNavigatorProps) {
  const editable = isDayEditable(selectedDayNumber, todayDayNumber);
  const isToday = selectedDayNumber === todayDayNumber;
  const canGoBack = selectedDayNumber > 1;
  const canGoForward = selectedDayNumber < todayDayNumber;

  // Compute formatted date for the selected day
  const displayDate = dateStr ?? formatDateShort(
    (() => {
      const [y, m, d] = startDate.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      dt.setUTCDate(dt.getUTCDate() + selectedDayNumber - 1);
      return dt.toISOString().split("T")[0];
    })()
  );

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Locked badge — always reserve h-5 so layout doesn't shift */}
      <div className="h-5 flex items-center">
        {!editable && (
          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
            <Lock className="h-2.5 w-2.5" />
            Locked
          </Badge>
        )}
      </div>

      {/* Arrow row */}
      <div className="flex items-center justify-between gap-2 w-full">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onDayChange(selectedDayNumber - 1)}
          disabled={!canGoBack}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex flex-col items-center gap-0.5 min-w-0">
          <span className="text-sm font-semibold">
            Day {selectedDayNumber}
          </span>
          <span className="text-[11px] text-muted-foreground">{displayDate}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onDayChange(selectedDayNumber + 1)}
          disabled={!canGoForward}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Today button — always reserve h-7 so layout doesn't shift */}
      <div className="h-7 flex items-center">
        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => onDayChange(todayDayNumber)}
          >
            Today
          </Button>
        )}
      </div>
    </div>
  );
}
