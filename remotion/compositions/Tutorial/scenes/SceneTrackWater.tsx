import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle } from "../lib/theme-styles";
import { TapIndicator } from "../components/TapIndicator";
import { CaptionOverlay } from "../components/CaptionOverlay";

type SceneTrackWaterProps = {
  theme: ThemeStyle;
  target: number;
  unit: string;
};

export const SceneTrackWater: React.FC<SceneTrackWaterProps> = ({
  theme,
  target,
  unit,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardFade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Three taps at frames 30, 60, 90
  const TAP_FRAMES = [30, 60, 90];
  const INCREMENT = unit === "oz" ? 16 : unit === "ml" ? 250 : 1;

  let tapsCompleted = 0;
  for (const tapFrame of TAP_FRAMES) {
    if (frame >= tapFrame + 8) tapsCompleted++;
  }

  const displayValue = tapsCompleted * INCREMENT;
  const fillPercent = Math.min((displayValue / target) * 100, 100);
  const isComplete = displayValue >= target;

  // Button scale spring for feedback
  const lastTapFrame = TAP_FRAMES[tapsCompleted - 1] ?? 0;
  const btnScale = tapsCompleted > 0
    ? spring({ frame: frame - lastTapFrame - 5, fps, config: { damping: 15, stiffness: 200 } })
    : 1;

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <div style={{ padding: "60px 20px 0", opacity: cardFade }}>
        {/* Section header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: theme.fontBody, fontSize: 12, fontWeight: 600,
            color: theme.fg, textTransform: "uppercase" as const, letterSpacing: 1,
          }}>
            Nutrition
          </span>
        </div>

        {/* Counter item matching real CounterBlock layout */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 0", borderBottom: `1px solid ${theme.border}50`,
          opacity: isComplete ? 0.6 : 1,
        }}>
          {/* Left accent bar */}
          <div style={{
            width: 3, alignSelf: "stretch", minHeight: 22,
            borderRadius: 3, background: isComplete ? theme.success : theme.muted,
            marginTop: 1,
          }} />

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: theme.fontBody, fontSize: 13, fontWeight: 500,
                    color: isComplete ? theme.mutedFg : theme.fg,
                    textDecoration: isComplete ? "line-through" : "none",
                  }}>
                    Water
                  </span>
                  <span style={{
                    fontSize: 7, fontFamily: theme.fontBody,
                    padding: "1px 4px", borderRadius: 3,
                    border: `1px solid ${theme.accent}66`,
                    color: theme.accent, lineHeight: 1.4,
                  }}>
                    Hard
                  </span>
                </div>
                {!isComplete && (
                  <span style={{
                    fontFamily: theme.fontBody, fontSize: 10,
                    color: theme.mutedFg, marginTop: 2, display: "block",
                  }}>
                    {displayValue} / {target} {unit}
                  </span>
                )}
              </div>

              {/* Done checkmark when complete */}
              {isComplete && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%",
                  background: theme.success,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <svg width="10" height="10" viewBox="0 0 14 14">
                    <path d="M3 7l3 3 5-5" fill="none" stroke={theme.successFg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>

            {/* Progress bar + buttons (when not complete) */}
            {!isComplete && (
              <div style={{ marginTop: 8 }}>
                {/* Progress bar */}
                <div style={{
                  height: 6, borderRadius: 9999,
                  background: theme.muted, overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: 9999,
                    width: `${fillPercent}%`,
                    background: theme.primary,
                  }} />
                </div>

                {/* [-] value [+] buttons */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, marginTop: 6,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: theme.mutedFg, fontSize: 14,
                  }}>
                    −
                  </div>
                  <span style={{
                    fontFamily: theme.fontBody, fontSize: 10, fontWeight: 500,
                    minWidth: 54, textAlign: "center", color: theme.fg,
                  }}>
                    {displayValue} {unit}
                  </span>
                  <div style={{
                    width: 28, height: 28, borderRadius: 6,
                    border: `1px solid ${theme.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: theme.mutedFg, fontSize: 14,
                    transform: `scale(${tapsCompleted > 0 && btnScale < 1 ? 0.92 : 1})`,
                  }}>
                    +
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tap indicators on the + button */}
      {TAP_FRAMES.map((tapFrame, i) => (
        <TapIndicator key={i} x={132} y={215} delay={tapFrame} />
      ))}

      <CaptionOverlay text="Tap to track your water intake" theme={theme} />
    </AbsoluteFill>
  );
};
