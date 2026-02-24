import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle, ThemeName } from "../lib/theme-styles";
import type { TutorialVideoProps } from "../TutorialVideo";
import { MockTaskItem } from "../components/MockTaskItem";
import { TapIndicator } from "../components/TapIndicator";
import { CaptionOverlay } from "../components/CaptionOverlay";

type SceneCheckTaskProps = {
  theme: ThemeStyle;
  themeName: ThemeName;
  taskName: string;
  habits: TutorialVideoProps["habits"];
};

export const SceneCheckTask: React.FC<SceneCheckTaskProps> = ({
  theme,
  themeName,
  taskName,
  habits,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardFade = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Tap happens at frame 40, check animates after
  const TAP_FRAME = 40;
  const showCheck = frame >= TAP_FRAME + 10;

  // Success message after check
  const glowProgress = spring({
    frame: frame - TAP_FRAME - 15,
    fps,
    config: { damping: 200 },
  });

  // Show first few habits from fitness category
  const fitnessHabits = habits.filter((h) => h.category === "fitness");

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <div style={{ padding: "60px 20px 0", opacity: cardFade }}>
        {/* Section header matching DynamicDailyChecklist */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: theme.fontBody, fontSize: 12, fontWeight: 600,
            color: theme.fg, textTransform: "uppercase" as const, letterSpacing: 1,
          }}>
            Fitness
          </span>
        </div>

        {/* Render the target task item (animated check) */}
        <MockTaskItem
          name={taskName}
          theme={theme}
          isHard
          checked={showCheck}
          checkDelay={0}
        />

        {/* Render remaining fitness habits (unchecked) */}
        {fitnessHabits
          .filter((h) => h.name !== taskName)
          .slice(0, 2)
          .map((h) => (
            <MockTaskItem key={h.name} name={h.name} theme={theme} isHard={h.isHard} checked={false} />
          ))}

        {/* Completion badge */}
        {glowProgress > 0.1 && (
          <div style={{
            textAlign: "center", marginTop: 20,
            fontFamily: theme.fontBody, fontSize: 13,
            color: theme.success, fontWeight: 600,
            opacity: glowProgress,
            transform: `scale(${interpolate(glowProgress, [0, 1], [0.8, 1])})`,
          }}>
            1 of {habits.length} complete!
          </div>
        )}
      </div>

      {/* Tap indicator on the first task row */}
      <TapIndicator x={32} y={106} delay={TAP_FRAME} />

      <CaptionOverlay text={`Tap to check off "${taskName}"`} theme={theme} />
    </AbsoluteFill>
  );
};
