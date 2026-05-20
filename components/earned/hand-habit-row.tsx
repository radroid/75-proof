import { HandCheckbox } from "./hand-checkbox";

export interface HabitRowData {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  isHard: boolean;
}

// One row in the Today list. Presentational only — owner passes the
// onToggle callback and the `isEditable` flag (past days are locked).

export function HandHabitRow({
  habit,
  onToggle,
  isEditable,
}: {
  habit: HabitRowData;
  onToggle: () => void;
  isEditable: boolean;
}) {
  const ink = "var(--earned-ink, #1F1F1D)";
  const creamLight = "var(--earned-cream-light, #F9F3E1)";
  const muted = "rgba(31,31,29,0.55)";
  const checked = habit.completed;
  const state: "empty" | "star" | "locked" = !isEditable && !checked
    ? "locked"
    : checked
      ? "star"
      : "empty";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 14px",
        background: checked ? creamLight : "transparent",
        border: `1.5px ${checked ? "solid" : "dashed"} ${ink}`,
        boxShadow: checked ? `2px 2px 0 ${ink}` : "none",
        borderRadius: 10,
      }}
    >
      <HandCheckbox
        state={state}
        onClick={isEditable ? onToggle : undefined}
        disabled={!isEditable}
        label={`${checked ? "Unmark" : "Mark"} ${habit.name}`}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-caveat), 'Caveat', cursive",
            fontWeight: 600,
            fontSize: 24,
            lineHeight: 1.05,
            color: ink,
            textDecoration: checked
              ? "underline wavy var(--earned-star-gold, #D8A830)"
              : "none",
            textUnderlineOffset: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {habit.name}
        </div>
        {habit.isHard && (
          <div
            style={{
              fontFamily: "var(--font-poppins), system-ui, sans-serif",
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: muted,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            Hard
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-caveat), 'Caveat', cursive",
            fontSize: 22,
            lineHeight: 1,
            color: ink,
            fontWeight: 600,
          }}
        >
          {habit.streak}
        </div>
        <div
          style={{
            fontFamily: "var(--font-poppins), system-ui, sans-serif",
            fontSize: 9,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: muted,
            fontWeight: 600,
          }}
        >
          {habit.streak === 1 ? "day" : "days"}
        </div>
      </div>
    </div>
  );
}
