import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import type { ThemeStyle, ThemeName } from "../lib/theme-styles";
import { CaptionOverlay } from "../components/CaptionOverlay";

type SceneSwipeDaysProps = {
  theme: ThemeStyle;
  themeName: ThemeName;
};

export const SceneSwipeDays: React.FC<SceneSwipeDaysProps> = ({ theme, themeName }) => {
  const frame = useCurrentFrame();

  // Swipe starts at frame 30
  const SWIPE_START = 30;
  const swipeProgress = interpolate(
    frame,
    [SWIPE_START, SWIPE_START + 25],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) }
  );

  const card1X = interpolate(swipeProgress, [0, 1], [0, -400]);
  const card2X = interpolate(swipeProgress, [0, 1], [400, 0]);
  const card1Rotate = interpolate(swipeProgress, [0, 0.5, 1], [0, -3, -5]);
  const card2Rotate = interpolate(swipeProgress, [0, 0.5, 1], [5, 3, 0]);
  const card1Opacity = interpolate(swipeProgress, [0.5, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Swipe hand
  const handX = interpolate(frame, [SWIPE_START, SWIPE_START + 25], [280, 80],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.quad) });
  const handOpacity = interpolate(frame, [SWIPE_START - 10, SWIPE_START, SWIPE_START + 25, SWIPE_START + 35], [0, 0.8, 0.8, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.bg, overflow: "hidden" }}>
      {/* Day 1 Card */}
      <div style={{
        position: "absolute", top: 80, left: 20, right: 20,
        transform: `translateX(${card1X}px) rotate(${card1Rotate}deg)`,
        opacity: card1Opacity,
      }}>
        <ThemedDayCard day={1} theme={theme} themeName={themeName} completed />
      </div>

      {/* Day 2 Card */}
      <div style={{
        position: "absolute", top: 80, left: 20, right: 20,
        transform: `translateX(${card2X}px) rotate(${card2Rotate}deg)`,
      }}>
        <ThemedDayCard day={2} theme={theme} themeName={themeName} completed={false} />
      </div>

      {/* Swipe hand */}
      <div style={{ position: "absolute", bottom: 230, left: handX, opacity: handOpacity, pointerEvents: "none" }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path d="M18 8V6a2 2 0 00-4 0v2M10 8V5a2 2 0 00-4 0v5M14 8V5.5a2 2 0 00-4 0V8M18 8a2 2 0 014 0v5a8 8 0 01-8 8H9a8 8 0 01-5.66-2.34"
            stroke={theme.fg} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <CaptionOverlay text="Swipe to see past days" theme={theme} />
    </AbsoluteFill>
  );
};

// ─── Theme-specific day card ───

const ThemedDayCard: React.FC<{
  day: number;
  theme: ThemeStyle;
  themeName: ThemeName;
  completed: boolean;
}> = ({ day, theme, themeName, completed }) => {
  const sampleTasks = ["Workout 1", "Water", "Reading"];

  return (
    <div style={{
      background: theme.card,
      borderRadius: themeName === "military" ? 0 : themeName === "broadsheet" ? 2 : themeName === "zen" ? 12 : 12,
      border: `1px solid ${completed ? theme.success : theme.border}`,
      padding: themeName === "military" ? 16 : 20,
      minHeight: 350,
    }}>
      {/* Theme-specific header */}
      {themeName === "arctic" && (
        <ArcticCardHeader day={day} theme={theme} completed={completed} />
      )}
      {themeName === "broadsheet" && (
        <BroadsheetCardHeader day={day} theme={theme} completed={completed} />
      )}
      {themeName === "military" && (
        <MilitaryCardHeader day={day} theme={theme} completed={completed} />
      )}
      {themeName === "zen" && (
        <ZenCardHeader day={day} theme={theme} completed={completed} />
      )}

      {/* Mock task rows */}
      {sampleTasks.map((name) => (
        <div key={name} style={{
          display: "flex", alignItems: "flex-start", gap: 8,
          padding: "7px 0", borderBottom: `1px solid ${theme.border}50`,
        }}>
          <div style={{
            width: 3, alignSelf: "stretch", minHeight: 16, borderRadius: 3,
            background: completed ? theme.success : theme.muted, marginTop: 1,
          }} />
          <span style={{
            fontFamily: theme.fontBody, fontSize: 12, color: theme.fg,
            textDecoration: completed ? "line-through" : "none",
            opacity: completed ? 0.6 : 1,
          }}>
            {name}
          </span>
          <div style={{ marginLeft: "auto" }}>
            {completed && (
              <div style={{
                width: 14, height: 14, borderRadius: "50%", background: theme.success,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width="8" height="8" viewBox="0 0 14 14">
                  <path d="M3 7l3 3 5-5" fill="none" stroke={theme.successFg} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Arctic: Giant day number + segmented bar ───
function ArcticCardHeader({ day, theme, completed }: { day: number; theme: ThemeStyle; completed: boolean }) {
  return (
    <div style={{ textAlign: "left", marginBottom: 16, position: "relative" }}>
      <div style={{
        position: "absolute", top: -10, left: -6,
        fontFamily: theme.fontHeading, fontSize: 100, fontWeight: 700,
        color: theme.primary, opacity: 0.06, lineHeight: 0.85,
      }}>
        {day}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 4, position: "relative" }}>
        <div style={{ fontFamily: theme.fontHeading, fontSize: 56, fontWeight: 700, lineHeight: 0.85, color: theme.fg }}>
          {day}
        </div>
        <div style={{ paddingBottom: 6, fontFamily: theme.fontBody, fontSize: 18, fontWeight: 300, color: theme.mutedFg, opacity: 0.4 }}>
          /75
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, marginTop: 10 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i === 0 && day <= 5 ? theme.primary : theme.muted, opacity: i === 0 && day <= 5 ? 0.7 : 1 }} />
        ))}
      </div>
    </div>
  );
}

// ─── Broadsheet: Newspaper column header ───
function BroadsheetCardHeader({ day, theme, completed }: { day: number; theme: ThemeStyle; completed: boolean }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ borderTop: `2px solid ${theme.fg}`, paddingTop: 6, borderBottom: `1px solid ${theme.border}`, paddingBottom: 6 }}>
        <div style={{ fontFamily: theme.fontHeading, fontSize: 22, fontWeight: 700, color: theme.fg, textAlign: "center" }}>
          Day {day}
        </div>
        <div style={{ fontFamily: theme.fontBody, fontSize: 8, textAlign: "center", letterSpacing: 3, textTransform: "uppercase" as const, color: theme.mutedFg, marginTop: 2 }}>
          {completed ? "Edition Complete" : "In Progress"}
        </div>
      </div>
    </div>
  );
}

// ─── Military: Stencil number + tactical bar ───
function MilitaryCardHeader({ day, theme, completed }: { day: number; theme: ThemeStyle; completed: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 7, letterSpacing: 4, textTransform: "uppercase" as const, color: theme.mutedFg, fontFamily: theme.fontBody, marginBottom: 4 }}>
        OPERATION DAY
      </div>
      <div style={{ fontFamily: theme.fontHeading, fontSize: 48, lineHeight: 1, color: theme.fg, textShadow: `0 0 30px rgba(194,178,128,0.15)` }}>
        {String(day).padStart(2, "0")}
      </div>
      <div style={{ display: "flex", gap: 1, marginTop: 8 }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, background: i < day ? theme.mutedFg : theme.secondary }} />
        ))}
      </div>
    </div>
  );
}

// ─── Zen: Enso circle ───
function ZenCardHeader({ day, theme, completed }: { day: number; theme: ThemeStyle; completed: boolean }) {
  const circumference = 2 * Math.PI * 34;
  const fillPct = completed ? 1 : 0.013;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
      <div style={{ position: "relative" }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke={theme.fg} strokeWidth="1.5" opacity={0.15} strokeDasharray="3 6" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={theme.primary} strokeWidth="2" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - circumference * fillPct}
            transform="rotate(-90 40 40)" />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontFamily: theme.fontHeading, fontSize: 24, fontWeight: 300, color: theme.fg }}>{day}</span>
        </div>
      </div>
      <span style={{ fontSize: 7, letterSpacing: 2, textTransform: "uppercase" as const, color: theme.mutedFg, fontFamily: theme.fontBody, marginTop: 4 }}>
        of seventy-five
      </span>
    </div>
  );
}
