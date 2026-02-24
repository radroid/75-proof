import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle, ThemeName } from "../lib/theme-styles";
import type { TutorialVideoProps } from "../TutorialVideo";
import { MockDashboardHero } from "../components/MockDashboardHero";
import { CaptionOverlay } from "../components/CaptionOverlay";

type SceneDashboardProps = {
  theme: ThemeStyle;
  themeName: ThemeName;
  habits: TutorialVideoProps["habits"];
  displayName: string;
};

export const SceneDashboard: React.FC<SceneDashboardProps> = ({
  theme,
  themeName,
  habits,
  displayName,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const listFadeIn = interpolate(frame, [40, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden", position: "relative" }}>
      {/* Theme-specific hero section */}
      <MockDashboardHero
        dayNumber={1}
        displayName={displayName}
        theme={theme}
        themeName={themeName}
        completedSegments={0}
        totalSegments={habits.length}
      />

      {/* Habit list preview below the hero */}
      <div
        style={{
          padding: "12px 20px",
          opacity: listFadeIn,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {habits.slice(0, 4).map((habit, i) => {
          const itemSlide = spring({
            frame: frame - (45 + i * 5),
            fps,
            config: { damping: 200 },
          });

          return (
            <div
              key={habit.name}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "8px 0",
                borderBottom: `1px solid ${theme.border}50`,
                transform: `translateX(${interpolate(itemSlide, [0, 1], [20, 0])}px)`,
                opacity: itemSlide,
              }}
            >
              {/* Left accent bar */}
              <div style={{
                width: 3, alignSelf: "stretch", minHeight: 18,
                borderRadius: 3, background: theme.muted, marginTop: 1,
              }} />
              {/* Label */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{
                  fontFamily: theme.fontBody, fontSize: 13,
                  fontWeight: 500, color: theme.fg,
                }}>
                  {habit.name}
                </span>
                <span style={{
                  fontSize: 7, fontFamily: theme.fontBody,
                  padding: "1px 4px", borderRadius: 3,
                  border: `1px solid ${habit.isHard ? theme.accent + "66" : theme.mutedFg + "4d"}`,
                  color: habit.isHard ? theme.accent : theme.mutedFg,
                  lineHeight: 1.4,
                }}>
                  {habit.isHard ? "Hard" : "Soft"}
                </span>
              </div>
            </div>
          );
        })}
        {habits.length > 4 && (
          <div style={{
            fontFamily: theme.fontBody, fontSize: 11, color: theme.mutedFg,
            textAlign: "center", padding: "6px 0", opacity: listFadeIn,
          }}>
            +{habits.length - 4} more
          </div>
        )}
      </div>

      <CaptionOverlay text="Here's your dashboard" theme={theme} />
    </AbsoluteFill>
  );
};
