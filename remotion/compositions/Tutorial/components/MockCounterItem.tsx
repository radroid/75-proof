import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle } from "../lib/theme-styles";

type MockCounterItemProps = {
  name: string;
  target: number;
  unit: string;
  theme: ThemeStyle;
  isHard?: boolean;
  fillProgress?: number;
  fillDelay?: number;
};

/**
 * Matches the real CounterBlock layout:
 * - 3px left accent bar (success when complete, muted when not)
 * - Name with Hard/Soft badge
 * - "value / target unit" subtitle
 * - Progress bar (h-2 bg-muted, fill bg-primary)
 * - Minus button | value display | Plus button
 * - opacity-60 when completed, green circle checkmark
 */
export const MockCounterItem: React.FC<MockCounterItemProps> = ({
  name,
  target,
  unit,
  theme,
  isHard = true,
  fillProgress = 0,
  fillDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const animProgress = spring({
    frame: frame - fillDelay,
    fps,
    config: { damping: 20, stiffness: 80 },
    durationInFrames: 60,
  });

  const currentFill = fillProgress * animProgress;
  const currentValue = Math.round(target * currentFill);
  const barWidth = currentFill * 100;
  const isComplete = currentFill >= 0.99;

  // Increment amount matches real app logic
  const increment = unit === "oz" ? 16 : unit === "ml" ? 250 : unit === "min" ? 5 : unit === "pages" ? 5 : 1;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: `1px solid ${theme.border}50`,
        opacity: isComplete ? 0.6 : 1,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: 3,
          alignSelf: "stretch",
          minHeight: 22,
          borderRadius: 3,
          background: isComplete ? theme.success : theme.muted,
          marginTop: 1,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontFamily: theme.fontBody,
                  fontSize: 13,
                  fontWeight: 500,
                  color: isComplete ? theme.mutedFg : theme.fg,
                  textDecoration: isComplete ? "line-through" : "none",
                }}
              >
                {name}
              </span>
              <span
                style={{
                  fontSize: 7,
                  fontFamily: theme.fontBody,
                  padding: "1px 4px",
                  borderRadius: 3,
                  border: `1px solid ${isHard ? theme.accent + "66" : theme.mutedFg + "4d"}`,
                  color: isHard ? theme.accent : theme.mutedFg,
                  lineHeight: 1.4,
                }}
              >
                {isHard ? "Hard" : "Soft"}
              </span>
            </div>
            {!isComplete && (
              <span style={{
                fontFamily: theme.fontBody, fontSize: 10, color: theme.mutedFg, marginTop: 2, display: "block",
              }}>
                {currentValue} / {target} {unit}
              </span>
            )}
          </div>

          {/* Done indicator when complete */}
          {isComplete && (
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: theme.success,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="10" height="10" viewBox="0 0 14 14">
                <path d="M3 7l3 3 5-5" fill="none" stroke={theme.successFg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress bar + buttons (only when not complete) */}
        {!isComplete && (
          <div style={{ marginTop: 8 }}>
            {/* Progress bar — matches h-2 rounded-full bg-muted */}
            <div style={{ height: 6, borderRadius: 9999, background: theme.muted, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 9999,
                width: `${barWidth}%`,
                background: theme.primary,
              }} />
            </div>

            {/* Buttons row: [-] value [+] */}
            <div style={{
              display: "flex", alignItems: "center", gap: 6, marginTop: 6,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                border: `1px solid ${theme.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: theme.mutedFg, fontSize: 14, fontWeight: 300,
              }}>
                −
              </div>
              <span style={{
                fontFamily: theme.fontBody, fontSize: 10, fontWeight: 500,
                minWidth: 50, textAlign: "center", color: theme.fg,
              }}>
                {currentValue} {unit}
              </span>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                border: `1px solid ${theme.border}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: theme.mutedFg, fontSize: 14, fontWeight: 300,
              }}>
                +
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
