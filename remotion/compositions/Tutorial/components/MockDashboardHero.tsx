import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { ThemeStyle } from "../lib/theme-styles";
import type { ThemeName } from "../lib/theme-styles";

type MockDashboardHeroProps = {
  dayNumber: number;
  displayName: string;
  theme: ThemeStyle;
  themeName: ThemeName;
  completedSegments: number;
  totalSegments: number;
};

export const MockDashboardHero: React.FC<MockDashboardHeroProps> = ({
  dayNumber,
  displayName,
  theme,
  themeName,
  completedSegments,
  totalSegments,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  if (themeName === "arctic") return <ArcticHero dayNumber={dayNumber} theme={theme} completedSegments={completedSegments} totalSegments={totalSegments} fadeIn={fadeIn} frame={frame} fps={fps} />;
  if (themeName === "broadsheet") return <BroadsheetHero dayNumber={dayNumber} theme={theme} completedSegments={completedSegments} totalSegments={totalSegments} fadeIn={fadeIn} frame={frame} fps={fps} />;
  if (themeName === "military") return <MilitaryHero dayNumber={dayNumber} theme={theme} completedSegments={completedSegments} totalSegments={totalSegments} fadeIn={fadeIn} frame={frame} fps={fps} />;
  return <ZenHero dayNumber={dayNumber} theme={theme} completedSegments={completedSegments} totalSegments={totalSegments} fadeIn={fadeIn} frame={frame} fps={fps} />;
};

// ─── Arctic: Giant day number + segmented progress bar + circle ring ───

function ArcticHero({ dayNumber, theme, completedSegments, totalSegments, fadeIn, frame, fps }: {
  dayNumber: number; theme: ThemeStyle; completedSegments: number; totalSegments: number; fadeIn: number; frame: number; fps: number;
}) {
  const numberScale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });

  return (
    <div style={{ padding: "16px 20px 0", opacity: fadeIn, position: "relative" }}>
      {/* Giant faint background number */}
      <div style={{
        position: "absolute", top: -8, left: -4,
        fontFamily: theme.fontHeading, fontSize: 180, fontWeight: 700,
        lineHeight: 0.85, color: theme.primary, opacity: 0.06,
        pointerEvents: "none", userSelect: "none",
      }}>
        {dayNumber}
      </div>

      <div style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 16 }}>
        {/* Left: day number */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 6 }}>
            <div style={{
              fontFamily: theme.fontHeading, fontSize: 100, fontWeight: 700,
              lineHeight: 0.85, color: theme.fg,
              transform: `scale(${numberScale})`, transformOrigin: "bottom left",
            }}>
              {dayNumber}
            </div>
            <div style={{ paddingBottom: 10, fontFamily: theme.fontBody, fontSize: 28, fontWeight: 300, color: theme.mutedFg, opacity: 0.4 }}>
              /75
            </div>
          </div>

          {/* Segmented progress bar (15 segments = 5 days each) */}
          <div style={{ marginTop: 12, maxWidth: 280 }}>
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: 15 }).map((_, i) => {
                const segFill = spring({ frame, fps, config: { damping: 200 }, delay: 15 + i * 3 });
                return (
                  <div key={i} style={{ flex: 1, height: 6, borderRadius: 2, background: theme.muted, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 2,
                      background: theme.primary,
                      width: i === 0 ? `${segFill * 30}%` : "0%",
                      opacity: i === 0 ? 0.7 : 0,
                    }} />
                  </div>
                );
              })}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", marginTop: 4,
              fontSize: 8, letterSpacing: 1.5, textTransform: "uppercase" as const,
              fontFamily: theme.fontBody, color: theme.mutedFg,
            }}>
              <span>Start</span>
              <span>Halfway</span>
              <span>Finish</span>
            </div>
          </div>
        </div>

        {/* Right: SVG progress ring */}
        <div style={{ flexShrink: 0, paddingTop: 4 }}>
          <svg width="80" height="80" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" stroke={theme.muted} strokeWidth="6" />
            <circle
              cx="60" cy="60" r="54"
              fill="none" stroke={theme.primary} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54}
              transform="rotate(-90 60 60)"
            />
            <text x="60" y="55" textAnchor="middle" fill={theme.fg}
              style={{ fontFamily: theme.fontHeading, fontSize: 28, fontWeight: 700 }}>
              1%
            </text>
            <text x="60" y="72" textAnchor="middle" fill={theme.mutedFg}
              style={{ fontFamily: theme.fontBody, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1 }}>
              Complete
            </text>
          </svg>
        </div>
      </div>

      {/* Geometric divider */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16 }}>
        <div style={{ height: 1, flex: 1, background: theme.border }} />
        <div style={{ display: "flex", gap: 4 }}>
          <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: theme.primary }} />
          <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: theme.primary, opacity: 0.6 }} />
          <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: theme.primary, opacity: 0.3 }} />
        </div>
        <div style={{ height: 1, flex: 1, background: theme.border }} />
      </div>
    </div>
  );
}

// ─── Broadsheet: Newspaper masthead with date, edition, volume ───

function BroadsheetHero({ dayNumber, theme, completedSegments, totalSegments, fadeIn, frame, fps }: {
  dayNumber: number; theme: ThemeStyle; completedSegments: number; totalSegments: number; fadeIn: number; frame: number; fps: number;
}) {
  const romanNumerals = ["I","II","III","IV","V"];
  const vol = romanNumerals[Math.min(dayNumber - 1, 4)] || String(dayNumber);

  return (
    <div style={{ padding: "12px 20px 0", opacity: fadeIn }}>
      {/* Top double border */}
      <div style={{ borderTop: `3px solid ${theme.fg}`, paddingTop: 2 }}>
        <div style={{ height: 2 }} />
      </div>

      {/* Date / edition bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 0", fontSize: 8, letterSpacing: 2,
        textTransform: "uppercase" as const, color: theme.mutedFg,
        borderBottom: `1px solid ${theme.border}`,
        fontFamily: theme.fontBody,
      }}>
        <span>February 23, 2026</span>
        <span>Morning Edition</span>
        <span>Vol. {vol}</span>
      </div>

      {/* Masthead title */}
      <div style={{ textAlign: "center", padding: "14px 0", borderBottom: `1px solid ${theme.border}` }}>
        <div style={{
          fontFamily: theme.fontHeading, fontSize: 30, fontWeight: 700,
          color: theme.fg, letterSpacing: -0.5, lineHeight: 1.1,
        }}>
          The 75 Proof Daily
        </div>
        <div style={{
          marginTop: 3, fontSize: 8, letterSpacing: 4,
          textTransform: "uppercase" as const, color: theme.mutedFg,
          fontFamily: theme.fontBody,
        }}>
          A Record of Discipline & Transformation
        </div>
      </div>

      {/* Status line */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 0", fontSize: 8, letterSpacing: 2,
        textTransform: "uppercase" as const, color: theme.mutedFg,
        borderBottom: `2px solid ${theme.fg}`,
        fontFamily: theme.fontBody,
      }}>
        <div>
          <span style={{ fontFamily: theme.fontHeading, fontSize: 14, fontWeight: 600, color: theme.fg }}>
            {completedSegments}/{totalSegments}
          </span>
          {" "}Objectives
        </div>
        <div>
          <span style={{ fontFamily: theme.fontHeading, fontSize: 14, fontWeight: 600, color: theme.fg }}>
            1%
          </span>
          {" "}Campaign Complete
        </div>
      </div>
    </div>
  );
}

// ─── Military: Tactical status bar + stencil day + 75-segment bar ───

function MilitaryHero({ dayNumber, theme, completedSegments, totalSegments, fadeIn, frame, fps }: {
  dayNumber: number; theme: ThemeStyle; completedSegments: number; totalSegments: number; fadeIn: number; frame: number; fps: number;
}) {
  const numberScale = spring({ frame, fps, config: { damping: 12, stiffness: 150 } });

  return (
    <div style={{ padding: "8px 16px 0", opacity: fadeIn }}>
      {/* Grid overlay hint */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none",
        opacity: 0.04,
        backgroundImage: `linear-gradient(rgba(194,178,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(194,178,128,0.3) 1px, transparent 1px)`,
        backgroundSize: "40px 40px",
      }} />

      {/* Status bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 7, letterSpacing: 3, textTransform: "uppercase" as const,
        color: theme.mutedFg, paddingBottom: 8, marginBottom: 12,
        borderBottom: `1px solid ${theme.border}`,
        fontFamily: theme.fontBody,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>CLASSIFIED</span>
          <span style={{ color: theme.border }}>|</span>
          <span style={{ color: theme.fg }}>OPERATOR-1</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: theme.fg }}>MISSION TIME: 08:00:00</span>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: theme.primary }} />
          <span style={{ color: theme.primary }}>ACTIVE</span>
        </div>
      </div>

      {/* Operation day */}
      <div style={{
        fontSize: 7, letterSpacing: 4, textTransform: "uppercase" as const,
        color: theme.mutedFg, marginBottom: 6,
        fontFamily: theme.fontBody,
      }}>
        OPERATION DAY
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
        <div style={{
          fontFamily: theme.fontHeading, fontSize: 80, lineHeight: 1,
          color: theme.fg,
          textShadow: `0 0 40px rgba(194,178,128,0.15)`,
          transform: `scale(${numberScale})`, transformOrigin: "bottom left",
        }}>
          {String(dayNumber).padStart(2, "0")}
        </div>
        <span style={{ fontSize: 20, fontWeight: 300, color: theme.border, fontFamily: theme.fontBody }}>
          /75
        </span>
      </div>

      {/* 75-segment tactical bar (show first 15 for space) */}
      <div style={{ marginTop: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 4,
              background: i < 1 ? theme.mutedFg : theme.secondary,
              borderRight: i < 29 ? `1px solid ${theme.bg}` : "none",
            }} />
          ))}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 4,
          fontSize: 7, letterSpacing: 2, color: theme.mutedFg,
          fontFamily: theme.fontBody,
        }}>
          <span>DAY 01</span>
          <span>OBJECTIVE: DAY 75</span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{
        marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr",
        gap: 1, borderRadius: 0, overflow: "hidden",
        background: theme.border,
      }}>
        {[
          { label: "COMPLETION", value: "1%" },
          { label: "OBJECTIVES", value: `${completedSegments}/${totalSegments}` },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: "8px 10px", textAlign: "center",
            background: theme.card,
          }}>
            <div style={{
              fontSize: 7, letterSpacing: 2, textTransform: "uppercase" as const,
              color: theme.mutedFg, fontFamily: theme.fontBody,
            }}>
              {stat.label}
            </div>
            <div style={{
              fontSize: 14, fontWeight: 700, marginTop: 2,
              fontFamily: theme.fontHeading, color: theme.fg,
            }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Zen: Enso circle with day number centered ───

function ZenHero({ dayNumber, theme, completedSegments, totalSegments, fadeIn, frame, fps }: {
  dayNumber: number; theme: ThemeStyle; completedSegments: number; totalSegments: number; fadeIn: number; frame: number; fps: number;
}) {
  const circleScale = spring({ frame, fps, config: { damping: 200 }, durationInFrames: 40 });
  const circumference = 2 * Math.PI * 68;

  return (
    <div style={{ padding: "8px 20px 0", opacity: fadeIn }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 20,
      }}>
        <span style={{
          fontSize: 9, letterSpacing: 3, textTransform: "uppercase" as const,
          color: theme.mutedFg, fontFamily: theme.fontBody,
        }}>
          Seventy-Five Hard
        </span>
        <span style={{ fontSize: 10, color: theme.mutedFg, fontFamily: theme.fontBody }}>
          Day {dayNumber}
        </span>
      </div>

      {/* Enso circle */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <svg width="140" height="140" viewBox="0 0 180 180">
            {/* Dashed background circle */}
            <circle cx="90" cy="90" r="68" fill="none"
              stroke={theme.fg} strokeWidth="2" strokeLinecap="round"
              opacity={0.15} strokeDasharray="4 8" />
            {/* Progress circle */}
            <circle cx="90" cy="90" r="68" fill="none"
              stroke={theme.primary} strokeWidth="3" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (circumference * circleScale * 0.013)}
              transform="rotate(-90 90 90)" />
          </svg>

          {/* Center text */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              fontFamily: theme.fontHeading, fontSize: 40, fontWeight: 300,
              lineHeight: 1, color: theme.fg,
            }}>
              {dayNumber}
            </span>
            <span style={{
              fontSize: 7, letterSpacing: 3, textTransform: "uppercase" as const,
              marginTop: 4, color: theme.mutedFg, fontFamily: theme.fontBody,
            }}>
              of seventy-five
            </span>
          </div>
        </div>

        {/* Fulfilled count */}
        <div style={{ textAlign: "center", marginTop: 14 }}>
          <div style={{
            fontFamily: theme.fontHeading, fontSize: 20, fontWeight: 300, color: theme.fg,
          }}>
            {completedSegments}/{totalSegments}
          </div>
          <div style={{
            fontSize: 8, letterSpacing: 2, textTransform: "uppercase" as const,
            marginTop: 2, color: theme.mutedFg, fontFamily: theme.fontBody,
          }}>
            fulfilled
          </div>
        </div>

        {/* Brush stroke divider */}
        <svg width="160" height="8" viewBox="0 0 200 8" style={{ marginTop: 14 }}>
          <path d="M 0 4 Q 50 1, 100 4 Q 150 7, 200 4" fill="none"
            stroke={theme.mutedFg} strokeWidth="1.5" opacity={0.4} />
        </svg>
      </div>
    </div>
  );
}
