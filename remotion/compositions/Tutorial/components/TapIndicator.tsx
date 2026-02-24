import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

type TapIndicatorProps = {
  x: number;
  y: number;
  delay?: number;
  color?: string;
};

export const TapIndicator: React.FC<TapIndicatorProps> = ({
  x,
  y,
  delay = 0,
  color = "rgba(0,0,0,0.15)",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const adjustedFrame = frame - delay;
  if (adjustedFrame < 0) return null;

  // Finger descends and taps
  const tapDown = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 15, stiffness: 200 },
    durationInFrames: 10,
  });

  // Finger lifts back up
  const tapUp = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 200 },
    delay: 12,
    durationInFrames: 10,
  });

  const fingerY = interpolate(tapDown - tapUp, [0, 1], [-20, 0]);
  const fingerScale = interpolate(tapDown - tapUp, [0, 1], [0.9, 1]);

  // Ripple effect at tap point
  const rippleScale = spring({
    frame: adjustedFrame,
    fps,
    config: { damping: 200 },
    delay: 6,
    durationInFrames: 20,
  });

  const rippleOpacity = interpolate(
    adjustedFrame,
    [6, 26],
    [0.4, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 100,
      }}
    >
      {/* Ripple */}
      <div
        style={{
          position: "absolute",
          width: 50,
          height: 50,
          borderRadius: "50%",
          background: color,
          transform: `translate(-50%, -50%) scale(${rippleScale * 1.5})`,
          opacity: rippleOpacity,
        }}
      />
      {/* Finger dot */}
      <div
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "rgba(0,0,0,0.25)",
          border: "2px solid rgba(255,255,255,0.5)",
          transform: `translate(-50%, -50%) translateY(${fingerY}px) scale(${fingerScale})`,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      />
    </div>
  );
};
