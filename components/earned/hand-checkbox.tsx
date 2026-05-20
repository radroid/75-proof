// Hand-drawn checkbox with three states:
//   - empty:  hand-trembled outline, no fill
//   - star:   gold fill with an inset hand-drawn star
//   - locked: dashed sage outline, read-only (past days / disabled rows)

export type HandCheckboxState = "empty" | "star" | "locked";

export function HandCheckbox({
  state,
  size = 36,
  onClick,
  disabled,
  label,
}: {
  state: HandCheckboxState;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  const ink = "var(--earned-ink, #1F1F1D)";
  const gold = "var(--earned-star-gold, #D8A830)";
  const sage = "var(--earned-sage, #7A8C6B)";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={state === "star"}
      style={{
        width: size,
        height: size,
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 36 36" width={size} height={size} style={{ display: "block" }}>
        <path
          d="M4 5 C 14 3, 28 4, 33 6 C 33.5 16, 33 26, 32 32 C 22 33, 10 33, 4 31 C 3 22, 3.5 12, 4 5 Z"
          fill={state === "star" ? gold : "none"}
          stroke={state === "locked" ? sage : ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={state === "locked" ? "3 3" : "none"}
        />
        {state === "star" && (
          <path
            d="M18 6 L21 14 L29 15 L23 20 L25 28 L18 24 L11 28 L13 20 L7 15 L15 14 Z"
            fill={ink}
          />
        )}
      </svg>
    </button>
  );
}
