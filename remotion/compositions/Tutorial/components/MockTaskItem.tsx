import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle } from "../lib/theme-styles";

type MockTaskItemProps = {
  name: string;
  theme: ThemeStyle;
  isHard?: boolean;
  checked?: boolean;
  checkDelay?: number;
};

/**
 * Matches the real TaskBlock component layout:
 * - 3px left accent bar (success when done, muted when not)
 * - Name with Hard/Soft badge
 * - Done indicator (green circle checkmark) on right
 * - opacity-60 + line-through when completed
 */
export const MockTaskItem: React.FC<MockTaskItemProps> = ({
  name,
  theme,
  isHard = true,
  checked = false,
  checkDelay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const checkProgress = checked
    ? spring({
        frame: frame - checkDelay,
        fps,
        config: { stiffness: 400, damping: 20 },
      })
    : 0;

  const isCompleted = checkProgress > 0.5;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "10px 0",
        borderBottom: `1px solid ${theme.border}50`,
        opacity: isCompleted ? 0.6 : 1,
      }}
    >
      {/* Left accent bar — matches w-[3px] rounded-full self-stretch */}
      <div
        style={{
          width: 3,
          alignSelf: "stretch",
          minHeight: 22,
          borderRadius: 3,
          background: isCompleted ? theme.success : theme.muted,
          marginTop: 1,
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontFamily: theme.fontBody,
              fontSize: 13,
              fontWeight: 500,
              color: isCompleted ? theme.mutedFg : theme.fg,
              textDecoration: isCompleted ? "line-through" : "none",
            }}
          >
            {name}
          </span>
          {/* Hard/Soft badge */}
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
      </div>

      {/* Done indicator — green circle with checkmark */}
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
          transform: `scale(${checkProgress})`,
          opacity: checkProgress,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 14 14">
          <path
            d="M3 7l3 3 5-5"
            fill="none"
            stroke={theme.successFg}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
