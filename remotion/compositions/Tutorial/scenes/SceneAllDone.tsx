import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, random } from "remotion";
import type { ThemeStyle, ThemeName } from "../lib/theme-styles";

type SceneAllDoneProps = {
  theme: ThemeStyle;
  themeName: ThemeName;
  displayName: string;
  totalHabits: number;
};

const CONFETTI_COUNT = 40;
const CONFETTI_COLORS = ["#ff6b6b", "#feca57", "#48dbfb", "#ff9ff3", "#54a0ff", "#5f27cd", "#01a3a4"];

export const SceneAllDone: React.FC<SceneAllDoneProps> = ({
  theme,
  themeName,
  displayName,
  totalHabits,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Main text scale-in
  const textScale = spring({ frame, fps, config: { damping: 10, stiffness: 150 } });

  // Checkmarks spring in
  const checks = Array.from({ length: totalHabits }).map((_, i) =>
    spring({ frame: frame - (5 + i * 4), fps, config: { damping: 12, stiffness: 200 } })
  );

  // Subtitle fade
  const subtitleFade = interpolate(frame, [30, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Theme-specific quote
  const quotes: Record<ThemeName, { text: string; attr: string }> = {
    arctic: { text: "Your journey begins now.", attr: "" },
    broadsheet: { text: "Discipline is choosing between what you want now and what you want most.", attr: "— Abraham Lincoln" },
    military: { text: "Discipline is the bridge between goals and accomplishment.", attr: "— Jim Rohn" },
    zen: { text: "Fall seven times, stand up eight.", attr: "七転び八起き" },
  };
  const quote = quotes[themeName];

  return (
    <AbsoluteFill style={{ background: theme.bg }}>
      {/* Confetti particles */}
      {Array.from({ length: CONFETTI_COUNT }).map((_, i) => {
        const startX = random(`confetti-x-${i}`) * 390;
        const endX = startX + (random(`confetti-dx-${i}`) - 0.5) * 100;
        const startDelay = random(`confetti-delay-${i}`) * 20;
        const speed = 0.6 + random(`confetti-speed-${i}`) * 0.8;
        const size = 4 + random(`confetti-size-${i}`) * 6;
        const color = CONFETTI_COLORS[Math.floor(random(`confetti-color-${i}`) * CONFETTI_COLORS.length)];
        const rotation = random(`confetti-rot-${i}`) * 720;

        const progress = interpolate(frame - startDelay, [0, durationInFrames * speed], [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        const y = interpolate(progress, [0, 1], [-20, 820]);
        const x = interpolate(progress, [0, 1], [startX, endX]);
        const rotate = interpolate(progress, [0, 1], [0, rotation]);
        const opacity = interpolate(progress, [0, 0.1, 0.8, 1], [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y,
            width: size, height: size * 0.6,
            background: color, borderRadius: 1,
            transform: `rotate(${rotate}deg)`, opacity, pointerEvents: "none",
          }} />
        );
      })}

      {/* Center content */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32,
      }}>
        {/* Checkmark row — matches the green circle done indicators */}
        <div style={{ display: "flex", gap: 6, marginBottom: 28 }}>
          {checks.map((progress, i) => (
            <div key={i} style={{
              width: 28, height: 28,
              borderRadius: themeName === "military" ? 0 : "50%",
              background: theme.success,
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: `scale(${progress})`, opacity: progress,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14">
                <path d="M3 7l3 3 5-5" fill="none" stroke={theme.successFg}
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Main text */}
        <div style={{
          fontFamily: theme.fontHeading,
          fontSize: themeName === "broadsheet" ? 30 : 34,
          fontWeight: themeName === "zen" ? 300 : 800,
          color: theme.fg, textAlign: "center",
          transform: `scale(${textScale})`,
          marginBottom: 12,
          letterSpacing: themeName === "military" ? 3 : 0,
          textTransform: themeName === "military" ? "uppercase" as const : "none" as const,
        }}>
          {themeName === "military" ? "MISSION READY" : "You\u2019re ready!"}
        </div>

        {/* Subtitle */}
        <div style={{
          fontFamily: theme.fontBody, fontSize: 14,
          color: theme.mutedFg, textAlign: "center",
          opacity: subtitleFade, lineHeight: 1.5,
        }}>
          Complete all {totalHabits} tasks each day.
          <br />
          75 days. No excuses.
        </div>

        {/* Theme-specific quote */}
        {quote.text && (
          <div style={{
            marginTop: 28, maxWidth: 300, textAlign: "center",
            opacity: subtitleFade,
          }}>
            {themeName === "broadsheet" && (
              <div style={{ borderTop: `2px solid ${theme.fg}`, borderBottom: `2px solid ${theme.fg}`, padding: "12px 0" }}>
                <div style={{ fontFamily: theme.fontHeading, fontSize: 14, fontStyle: "italic", color: theme.fg, lineHeight: 1.4 }}>
                  &ldquo;{quote.text}&rdquo;
                </div>
                <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const, color: theme.mutedFg, marginTop: 6, fontFamily: theme.fontBody }}>
                  {quote.attr}
                </div>
              </div>
            )}
            {themeName === "military" && (
              <div style={{ fontSize: 8, letterSpacing: 3, textTransform: "uppercase" as const, color: theme.border, fontFamily: theme.fontBody }}>
                &ldquo;{quote.text}&rdquo;
                <div style={{ marginTop: 4, fontSize: 7 }}>{quote.attr}</div>
              </div>
            )}
            {themeName === "zen" && (
              <>
                <svg width="40" height="2" viewBox="0 0 40 2" style={{ margin: "0 auto 10px" }}>
                  <line x1="0" y1="1" x2="40" y2="1" stroke={theme.mutedFg} strokeWidth="1" opacity={0.4} />
                </svg>
                <div style={{ fontFamily: theme.fontHeading, fontSize: 14, fontStyle: "italic", color: theme.mutedFg, lineHeight: 1.4 }}>
                  &ldquo;{quote.text}&rdquo;
                </div>
                <div style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase" as const, color: theme.muted, marginTop: 6, fontFamily: theme.fontBody }}>
                  {quote.attr}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
