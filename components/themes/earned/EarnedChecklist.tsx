"use client";

/*
 * EarnedChecklist — the paper-notebook rendering of the daily habit list.
 *
 * It is a drop-in for DynamicDailyChecklist (identical props) and reuses the
 * exact same data + mutation hook (`useHabitEntries`) and the same confetti /
 * markDayComplete transition logic. Only the presentation changes: each habit
 * becomes an `EarnedHabitRow` (hand-drawn checkbox, Caveat name, sticker card)
 * instead of a shadcn TaskBlock / CounterBlock.
 */
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { Confetti, useConfetti } from "@/components/ui/confetti";
import { useHabitEntries } from "@/hooks/use-habit-entries";
import { useGuest } from "@/components/guest-provider";
import { markDayComplete as localMarkDayComplete } from "@/lib/local-store/mutations";
import {
  HABIT_CATEGORY_LABELS,
  HABIT_CATEGORY_ORDER,
} from "@/convex/lib/habitCategories";
import { EarnedHabitRow, EarnedCheckbox, EC, HAND, SANS } from "./EarnedPaper";

interface EarnedChecklistProps {
  challengeId: Id<"challenges">;
  userId: Id<"users">;
  dayNumber: number;
  date: string;
  isEditable?: boolean;
  userTimezone?: string;
}

function formatCounterNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function incrementForUnit(unit: string, target: number): number {
  switch (unit) {
    case "oz":
      return 16;
    case "ml":
      return 250;
    case "min":
      return 5;
    case "pages":
      return 5;
    default:
      return target <= 5 ? 1 : target / 5;
  }
}

/** Small round ink stepper button for paper counters. */
function StepButton({
  sign,
  onClick,
  disabled,
  label,
}: {
  sign: "−" | "+";
  onClick: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        border: `1.5px solid ${EC.ink}`,
        background: EC.creamLight,
        color: EC.ink,
        fontFamily: SANS,
        fontWeight: 700,
        fontSize: 16,
        lineHeight: 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        boxShadow: `1.5px 1.5px 0 ${EC.ink}`,
        filter: "url(#earned-rough-soft)",
        touchAction: "manipulation",
        padding: 0,
      }}
    >
      {sign}
    </button>
  );
}

export function EarnedChecklist({
  challengeId,
  userId,
  dayNumber,
  date,
  isEditable = true,
  userTimezone,
}: EarnedChecklistProps) {
  const {
    habitDefs,
    entryMap,
    requiredItems,
    requiredDone,
    handleToggleTask,
    handleUpdateCounter,
  } = useHabitEntries({
    challengeId,
    userId,
    dayNumber,
    date,
    userTimezone,
    isEditable,
  });

  const { isActive: confettiActive, trigger: triggerConfetti } = useConfetti();
  const { isGuest } = useGuest();
  const markDayCompleteConvex = useMutation(api.habitEntries.markDayComplete);
  // Keyed on (challengeId, dayNumber) so navigating to an already-complete past
  // day doesn't re-fire the celebration / a duplicate markDayComplete.
  const prevAllDoneRef = useRef({ key: "", value: false });

  const allDone = requiredItems > 0 && requiredDone === requiredItems;

  useEffect(() => {
    if (!habitDefs) return;
    const key = `${challengeId}:${dayNumber}`;
    const prev = prevAllDoneRef.current;
    if (prev.key !== key) {
      prevAllDoneRef.current = { key, value: allDone };
      return;
    }
    const flippedToDone = allDone && !prev.value;
    if (flippedToDone) {
      triggerConfetti();
      if (isGuest) {
        localMarkDayComplete({
          challengeId: challengeId as unknown as string,
          dayNumber,
        });
      } else {
        markDayCompleteConvex({ challengeId, dayNumber }).catch(() => {});
      }
    }
    prevAllDoneRef.current = { key, value: allDone };
  }, [
    habitDefs,
    allDone,
    triggerConfetti,
    markDayCompleteConvex,
    challengeId,
    dayNumber,
    isGuest,
  ]);

  if (!habitDefs) return null;

  // Group by category, known categories first in canonical order, then extras.
  const grouped = new Map<string, typeof habitDefs>();
  for (const habit of habitDefs) {
    const cat = habit.category ?? "other";
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(habit);
  }
  const knownInOrder = HABIT_CATEGORY_ORDER.filter((c) => grouped.has(c));
  const knownSet = new Set(HABIT_CATEGORY_ORDER);
  const extras = Array.from(grouped.keys()).filter((c) => !knownSet.has(c)).sort();
  const sortedCategories = [...knownInOrder, ...extras];
  const showCategoryHeaders = sortedCategories.length > 1;

  const renderHabit = (habit: (typeof habitDefs)[number]) => {
    const entry = entryMap.get(habit._id);
    const completed = entry?.completed ?? false;

    if (habit.blockType === "counter") {
      const value = entry?.value ?? 0;
      const target = habit.target ?? 1;
      const unit = habit.unit ?? "";
      const inc = incrementForUnit(unit, target);
      const noteParts = [`${formatCounterNumber(value)} / ${formatCounterNumber(target)}${unit ? ` ${unit}` : ""}`];
      if (!habit.isHard) noteParts.push("optional");
      return (
        <EarnedHabitRow
          key={habit._id}
          name={habit.name}
          note={noteParts.join("  ·  ")}
          state={completed ? "checked" : "empty"}
          isEditable={false}
          right={
            isEditable && !completed ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <StepButton
                  sign="−"
                  onClick={() => handleUpdateCounter(habit._id, value, -inc)}
                  disabled={value <= 0}
                  label={`Decrease ${habit.name}`}
                />
                <StepButton
                  sign="+"
                  onClick={() => handleUpdateCounter(habit._id, value, inc)}
                  label={`Increase ${habit.name}`}
                />
              </div>
            ) : undefined
          }
        />
      );
    }

    return (
      <EarnedHabitRow
        key={habit._id}
        name={habit.name}
        note={habit.isHard ? undefined : "optional"}
        state={completed ? "checked" : "empty"}
        isEditable={isEditable}
        onToggle={() => handleToggleTask(habit._id)}
      />
    );
  };

  return (
    <>
      <Confetti isActive={confettiActive} />

      {!isEditable && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
            padding: "9px 13px",
            border: `1.5px dashed ${EC.ink}`,
            borderRadius: 11,
            background: "rgba(249,243,225,0.55)",
          }}
        >
          <EarnedCheckbox state="rest" size={22} />
          <span style={{ fontFamily: HAND, fontSize: 18, color: "rgba(31,31,29,0.65)" }}>
            This day is locked — view only.
          </span>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          opacity: isEditable ? 1 : 0.8,
          pointerEvents: isEditable ? undefined : "none",
        }}
      >
        {sortedCategories.map((category) => {
          const habits = grouped.get(category)!;
          return (
            <div key={category} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {showCategoryHeaders && (
                <div
                  style={{
                    fontFamily: HAND,
                    fontSize: 18,
                    fontWeight: 600,
                    // Pencil-grey, not blue — blue is reserved for completion marks.
                    // 0.78 alpha keeps the warm pencil hue while clearing WCAG AA
                    // (~5.6:1 on cream; 0.55 was ~3.0:1).
                    color: "rgba(58,52,38,0.78)",
                    paddingLeft: 2,
                    marginTop: 2,
                  }}
                >
                  {HABIT_CATEGORY_LABELS[category] ?? category.replace(/-/g, " ")}
                </div>
              )}
              {habits.map(renderHabit)}
            </div>
          );
        })}
      </div>
    </>
  );
}
