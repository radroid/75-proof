import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle } from "../lib/theme-styles";
import { CaptionOverlay } from "../components/CaptionOverlay";
import { TapIndicator } from "../components/TapIndicator";

type SceneReadingPhotoProps = {
  theme: ThemeStyle;
};

export const SceneReadingPhoto: React.FC<SceneReadingPhotoProps> = ({
  theme,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardFade = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Reading counter fills in over ~40 frames
  const readingFill = spring({
    frame: frame - 15,
    fps,
    config: { damping: 20, stiffness: 60 },
    durationInFrames: 40,
  });

  const readingValue = Math.round(20 * readingFill);
  const readingComplete = readingFill > 0.95;

  // Camera flash at frame 75
  const FLASH_FRAME = 75;
  const flashOpacity = interpolate(
    frame,
    [FLASH_FRAME, FLASH_FRAME + 4, FLASH_FRAME + 15],
    [0, 0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Photo checkmark after flash
  const photoCheck = spring({
    frame: frame - FLASH_FRAME - 8,
    fps,
    config: { stiffness: 400, damping: 20 },
  });

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      <div style={{ padding: "50px 20px 0", opacity: cardFade }}>
        {/* Section header: Mind & Progress */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 4,
        }}>
          <span style={{
            fontFamily: theme.fontBody, fontSize: 12, fontWeight: 600,
            color: theme.fg, textTransform: "uppercase" as const, letterSpacing: 1,
          }}>
            Mind & Progress
          </span>
        </div>

        {/* Reading counter — matches CounterBlock */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 0", borderBottom: `1px solid ${theme.border}50`,
          opacity: readingComplete ? 0.6 : 1,
        }}>
          <div style={{
            width: 3, alignSelf: "stretch", minHeight: 22,
            borderRadius: 3, background: readingComplete ? theme.success : theme.muted, marginTop: 1,
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: theme.fontBody, fontSize: 13, fontWeight: 500,
                    color: readingComplete ? theme.mutedFg : theme.fg,
                    textDecoration: readingComplete ? "line-through" : "none",
                  }}>
                    Reading
                  </span>
                  <span style={{
                    fontSize: 7, fontFamily: theme.fontBody, padding: "1px 4px",
                    borderRadius: 3, border: `1px solid ${theme.accent}66`,
                    color: theme.accent, lineHeight: 1.4,
                  }}>
                    Hard
                  </span>
                </div>
                {!readingComplete && (
                  <span style={{ fontFamily: theme.fontBody, fontSize: 10, color: theme.mutedFg, marginTop: 2, display: "block" }}>
                    {readingValue} / 20 min
                  </span>
                )}
              </div>
              {readingComplete && (
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", background: theme.success,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="10" height="10" viewBox="0 0 14 14">
                    <path d="M3 7l3 3 5-5" fill="none" stroke={theme.successFg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </div>
            {!readingComplete && (
              <div style={{ marginTop: 8 }}>
                <div style={{ height: 6, borderRadius: 9999, background: theme.muted, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 9999,
                    width: `${readingFill * 100}%`,
                    background: theme.primary,
                  }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress Photo task — matches TaskBlock */}
        <div style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 0", borderBottom: `1px solid ${theme.border}50`,
          opacity: photoCheck > 0.5 ? 0.6 : 1,
        }}>
          <div style={{
            width: 3, alignSelf: "stretch", minHeight: 22,
            borderRadius: 3, background: photoCheck > 0.5 ? theme.success : theme.muted, marginTop: 1,
          }} />
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontFamily: theme.fontBody, fontSize: 13, fontWeight: 500,
              color: photoCheck > 0.5 ? theme.mutedFg : theme.fg,
              textDecoration: photoCheck > 0.5 ? "line-through" : "none",
            }}>
              Progress Photo
            </span>
            <span style={{
              fontSize: 7, fontFamily: theme.fontBody, padding: "1px 4px",
              borderRadius: 3, border: `1px solid ${theme.accent}66`,
              color: theme.accent, lineHeight: 1.4,
            }}>
              Hard
            </span>
          </div>
          {/* Camera icon or check */}
          {photoCheck > 0.3 ? (
            <div style={{
              width: 18, height: 18, borderRadius: "50%", background: theme.success,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, transform: `scale(${photoCheck})`, opacity: photoCheck,
            }}>
              <svg width="10" height="10" viewBox="0 0 14 14">
                <path d="M3 7l3 3 5-5" fill="none" stroke={theme.successFg} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
              <rect x="2" y="5" width="20" height="15" rx="2" stroke={theme.mutedFg} strokeWidth="1.5" />
              <circle cx="12" cy="13" r="3" stroke={theme.mutedFg} strokeWidth="1.5" />
              <path d="M8 5V3h8v2" stroke={theme.mutedFg} strokeWidth="1.5" />
            </svg>
          )}
        </div>
      </div>

      <TapIndicator x={195} y={350} delay={FLASH_FRAME - 10} />

      {/* Camera flash overlay */}
      <AbsoluteFill style={{ background: "#ffffff", opacity: flashOpacity, pointerEvents: "none" }} />

      <CaptionOverlay text="Log reading & snap a progress photo" theme={theme} />
    </AbsoluteFill>
  );
};
