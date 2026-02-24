import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { ThemeStyle } from "../lib/theme-styles";

type CaptionOverlayProps = {
  text: string;
  theme: ThemeStyle;
  fadeInDuration?: number;
  fadeOutStart?: number;
};

export const CaptionOverlay: React.FC<CaptionOverlayProps> = ({
  text,
  theme,
  fadeInDuration = 15,
  fadeOutStart,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const outStart = fadeOutStart ?? durationInFrames - 15;

  const opacity = interpolate(
    frame,
    [0, fadeInDuration, outStart, outStart + 15],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const translateY = interpolate(frame, [0, fadeInDuration], [12, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 60,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: theme.fg + "cc",
          color: theme.bg,
          fontFamily: theme.fontBody,
          fontSize: 16,
          fontWeight: 600,
          padding: "10px 20px",
          borderRadius: 12,
          maxWidth: "85%",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {text}
      </div>
    </div>
  );
};
