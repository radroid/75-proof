"use client";

/*
 * Earned paper primitives — the hand-drawn, notebook look of the "earned"
 * design system, ported from the design project's iOS UI kit.
 *
 * These are PRESENTATIONAL only (props in, no data hooks) so they can be
 * composed both by the real dashboard (wired to live habit data) and by the
 * dev preview page used for visual iteration. They are brand-locked to the
 * earned palette on purpose — they only render inside the earned theme.
 */
import * as React from "react";

export const HAND = "'Caveat', 'Patrick Hand', cursive";
export const SANS = "'Poppins', system-ui, -apple-system, sans-serif";

export const EC = {
  cream: "#F4ECD8",
  creamLight: "#F9F3E1",
  creamDark: "#E8DEC4",
  ink: "#1F1F1D",
  inkSoft: "#3A3A36",
  sky: "#0085D4",
  skyDeep: "#006BA8",
  gold: "#D8A830",
  goldLt: "#F2C94C",
  rose: "#C75F4A",
  sage: "#7A8C6B",
  rule: "rgba(70,54,24,0.28)",
  margin: "rgba(199,95,74,0.6)",
} as const;

/**
 * Hidden SVG filter defs that give plain CSS borders a hand-drawn, slightly
 * wavering edge (feTurbulence → feDisplacementMap). Render ONCE per page that
 * uses the paper primitives — the filters are referenced by `filter: url(#…)`.
 * Zero layout footprint.
 */
export function EarnedPaperDefs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, pointerEvents: "none" }}
    >
      <defs>
        {/* Card / checkbox borders — visible waver. */}
        <filter id="earned-rough" x="-6%" y="-12%" width="112%" height="124%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.4" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        {/* Thin strokes (margin rule) — gentler so the line never severs. */}
        <filter id="earned-rough-soft" x="-20%" y="-4%" width="140%" height="108%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}

const STAR_PATH =
  "M 79.64 54.53 C 79.30 54.97 78.30 56.16 77.84 56.94 C 77.39 57.72 77.07 57.84 76.91 59.23 C 76.75 60.62 76.81 64.21 76.87 65.28 C 76.93 66.35 77.18 65.34 77.24 65.65 C 77.30 65.97 76.41 63.64 77.21 67.17 C 78.01 70.70 81.19 83.17 82.04 86.81 C 82.90 90.45 82.34 88.36 82.34 89.01 C 82.34 89.66 82.25 90.32 82.07 90.69 C 81.88 91.06 81.71 91.14 81.23 91.24 C 80.75 91.34 81.62 92.24 79.2 91.29 C 76.78 90.34 70.22 87.29 66.7 85.56 C 63.18 83.83 59.91 81.80 58.07 80.93 C 56.23 80.06 56.64 80.43 55.66 80.33 C 54.68 80.23 52.80 80.26 52.19 80.32 C 51.58 80.38 52.48 80.54 52.02 80.69 C 51.56 80.84 50.34 80.88 49.42 81.24 C 48.50 81.60 49.05 81.32 46.5 82.84 C 43.95 84.36 36.88 88.60 34.12 90.36 C 31.36 92.12 31.20 92.63 29.93 93.38 C 28.66 94.13 27.35 94.77 26.47 94.87 C 25.59 94.97 25.04 94.34 24.67 94 C 24.30 93.66 24.32 93.58 24.26 92.84 C 24.20 92.10 24.05 92.33 24.31 89.56 C 24.57 86.79 25.37 79.36 25.83 76.2 C 26.29 73.04 26.87 72.33 27.07 70.62 C 27.27 68.91 27.27 67.17 27.06 65.93 C 26.85 64.69 26.34 63.96 25.83 63.19 C 25.32 62.42 24.32 61.74 24.02 61.33 C 23.71 60.92 24.75 61.53 24 60.73 C 23.25 59.93 20.41 57.30 19.49 56.53 C 18.57 55.76 18.85 56.43 18.5 56.13 C 18.15 55.84 19.43 56.52 17.37 54.76 C 15.31 53.00 8.25 47.39 6.13 45.58 C 4.00 43.77 4.97 44.45 4.62 43.92 C 4.27 43.39 4.00 42.84 4 42.38 C 4.00 41.92 4.29 41.46 4.59 41.14 C 4.89 40.82 3.74 41.01 5.81 40.45 C 7.88 39.89 13.36 38.50 16.99 37.8 C 20.62 37.10 25.05 36.78 27.58 36.27 C 30.11 35.76 31.22 35.20 32.19 34.74 C 33.16 34.28 33.10 33.69 33.39 33.49 C 33.68 33.29 33.67 33.67 33.92 33.52 C 34.17 33.37 34.68 32.91 34.89 32.6 C 35.10 32.29 35.06 31.80 35.16 31.66 C 35.25 31.52 35.20 32.14 35.46 31.74 C 35.72 31.34 36.48 29.80 36.69 29.24 C 36.89 28.68 36.59 28.64 36.69 28.4 C 36.79 28.16 36.71 29.21 37.31 27.79 C 37.91 26.37 39.70 21.29 40.3 19.88 C 40.90 18.47 40.82 19.55 40.93 19.31 C 41.04 19.07 40.59 19.28 40.94 18.42 C 41.29 17.57 42.51 15.39 43.01 14.18 C 43.51 12.97 43.33 12.62 43.96 11.16 C 44.59 9.70 46.17 6.43 46.82 5.42 C 47.47 4.41 47.54 5.09 47.83 5.09 C 48.12 5.09 48.19 5.10 48.55 5.41 C 48.91 5.72 49.61 6.38 49.96 6.93 C 50.31 7.48 49.84 7.27 50.65 8.73 C 51.46 10.19 53.46 13.10 54.83 15.68 C 56.20 18.26 57.73 22.13 58.85 24.2 C 59.97 26.27 60.59 26.98 61.54 28.09 C 62.49 29.20 63.84 30.34 64.53 30.84 C 65.22 31.34 65.30 30.90 65.7 31.1 C 66.10 31.30 66.26 31.79 66.92 32.04 C 67.58 32.29 66.99 32.38 69.67 32.62 C 72.35 32.86 80.77 33.27 82.98 33.47 C 85.19 33.67 81.58 33.73 82.92 33.83 C 84.27 33.93 89.69 33.99 91.05 34.09 C 92.41 34.19 90.63 34.35 91.09 34.42 C 91.55 34.49 93.06 34.33 93.83 34.51 C 94.60 34.69 95.36 35.15 95.72 35.48 C 96.08 35.80 96.22 35.85 96 36.46 C 95.78 37.07 95.74 37.54 94.43 39.16 C 93.12 40.77 90.58 43.62 88.15 46.15 C 85.73 48.68 81.30 52.93 79.88 54.33 C 78.46 55.73 79.98 54.09 79.64 54.53 Z";

/** Canonical gold star, optionally filled or outlined. */
export function EarnedStar({
  size = 24,
  filled = true,
  color = EC.gold,
  stroke = EC.ink,
  sw = 3,
}: {
  size?: number;
  filled?: boolean;
  color?: string;
  stroke?: string;
  sw?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: "block", overflow: "visible" }}
      aria-hidden
    >
      <path
        d={STAR_PATH}
        fill={filled ? color : "none"}
        stroke={filled ? "none" : stroke}
        strokeWidth={filled ? 0 : sw}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Tiny deterministic "hand" jitter derived from a string seed, so each habit
 * row varies a little (baseline, rotation, stroke weight, shadow offset) but
 * stays stable across renders — no Math.random, no hydration mismatch.
 */
function handJitter(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const unit = (shift: number) => ((h >>> shift) & 1023) / 1023; // 0..1
  return {
    titleDy: (unit(2) - 0.5) * 2.4, // ±1.2px baseline drift
    titleRot: (unit(7) - 0.5) * 1.0, // ±0.5deg
    boxSw: 1.85 + unit(12) * 0.55, // checkbox stroke 1.85–2.4
    shadowX: 2.1 + unit(17) * 1.0, // 2.1–3.1
    shadowY: 2.1 + unit(22) * 1.0,
  };
}

export type CheckState = "empty" | "checked" | "star" | "missed" | "rest";

/** Hand-drawn wobbly checkbox with all five paper states. */
export function EarnedCheckbox({
  state = "empty",
  size = 34,
  onClick,
  disabled,
  label = "toggle habit",
  boxStroke = 2,
}: {
  state?: CheckState;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label?: string;
  /** Box outline stroke width — vary slightly per row for a hand-drawn look. */
  boxStroke?: number;
}) {
  const svg = (
    <svg
      viewBox="-1 -2 41 41"
      width={size}
      height={size}
      style={{ display: "block", overflow: "visible", filter: "url(#earned-rough-soft)" }}
    >
      <path
        d="M4 5 C 14 3, 28 4, 33 6 C 33.5 16, 33 26, 32 32 C 22 33, 10 33, 4 31 C 3 22, 3.5 12, 4 5 Z"
        fill={state === "star" ? EC.creamLight : "none"}
        stroke={state === "rest" ? EC.sage : EC.ink}
        strokeWidth={boxStroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={state === "rest" ? "3 3" : "none"}
      />
      {state === "checked" && (
        // Tail overshoots the box top-right corner — a hand-drawn tell.
        <path
          d="M7 19 C 10 23, 13 28, 16 29 C 23 21, 29 11, 37 2"
          fill="none"
          stroke={EC.sky}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {state === "star" && (
        <g transform="translate(6 6) scale(0.24)">
          <path d={STAR_PATH} fill={EC.gold} stroke="none" />
        </g>
      )}
      {state === "missed" && (
        <g stroke={EC.rose} strokeWidth={2.5} strokeLinecap="round">
          <path d="M9 10 L28 27" />
          <path d="M28 10 L9 27" />
        </g>
      )}
    </svg>
  );

  if (!onClick) {
    return (
      <span style={{ width: size, height: size, display: "inline-block" }} aria-hidden>
        {svg}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={state === "checked" || state === "star"}
      style={{
        width: size,
        height: size,
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        flexShrink: 0,
        touchAction: "manipulation",
      }}
    >
      {svg}
    </button>
  );
}

/** Ruled-paper surface. Wrap page content; optional red margin line. */
export function PaperSurface({
  margin = false,
  className,
  style,
  children,
}: {
  margin?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        backgroundColor: EC.cream,
        ...style,
      }}
    >
      {/* Ruled lines on their own layer: a faint turbulence waver makes them read
          as printed hand-ruling, not a laser-straight CSS grid, without touching text. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent 30.5px, ${EC.rule} 30.5px, ${EC.rule} 32px)`,
          backgroundPosition: "0 12px",
          filter: "url(#earned-rough-soft)",
          pointerEvents: "none",
        }}
      />
      {margin && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 18,
            width: 2.5,
            background: EC.margin,
            filter: "url(#earned-rough-soft)",
            pointerEvents: "none",
          }}
        />
      )}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}

type ChipTone = "cream" | "gold" | "sky" | "rose";

/** Sticker chip with hard ink offset shadow. */
export function EarnedChip({
  tone = "cream",
  children,
  size = "md",
  tilt = 0,
}: {
  tone?: ChipTone;
  children: React.ReactNode;
  size?: "sm" | "md";
  /** Slight rotation in degrees for a hand-placed sticker feel. */
  tilt?: number;
}) {
  const palette: Record<ChipTone, { bg: string; fg: string; sh: string }> = {
    cream: { bg: EC.creamLight, fg: EC.ink, sh: EC.ink },
    gold: { bg: EC.gold, fg: EC.ink, sh: EC.ink },
    sky: { bg: EC.skyDeep, fg: EC.creamLight, sh: EC.ink },
    rose: { bg: EC.creamLight, fg: EC.rose, sh: EC.rose },
  };
  const p = palette[tone];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: p.bg,
        color: p.fg,
        border: `1.5px solid ${EC.ink}`,
        padding: size === "sm" ? "4px 10px" : "6px 12px",
        borderRadius: 999,
        fontFamily: SANS,
        fontWeight: 600,
        fontSize: size === "sm" ? 12 : 13,
        boxShadow: `2px 2px 0 ${p.sh}`,
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
      }}
    >
      {children}
    </span>
  );
}

/** A single habit as a paper card. dashed when open, solid + sticker when done. */
export function EarnedHabitRow({
  name,
  note,
  state,
  onToggle,
  isEditable = true,
  right,
  tilt = 0,
}: {
  name: string;
  note?: string;
  state: CheckState;
  onToggle?: () => void;
  isEditable?: boolean;
  /** Optional right-aligned meta (e.g. counter control). */
  right?: React.ReactNode;
  /** Slight rotation in degrees so rows don't sit dead-parallel. */
  tilt?: number;
}) {
  const done = state === "checked" || state === "star";
  const j = handJitter(name);
  return (
    <div style={{ position: "relative", transform: tilt ? `rotate(${tilt}deg)` : undefined }}>
      {/* Hand-drawn border on its own layer so the waver filter never touches text. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          border: `1.5px ${done ? "solid" : "dashed"} ${EC.ink}`,
          borderRadius: 11,
          // Open rows still get a faint paper wash so the ink name reads clearly
          // (open ≠ disabled) while the rule lines whisper through behind it.
          background: done ? EC.creamLight : "rgba(249,243,225,0.55)",
          // Per-row shadow offset jitter so the "stickers" aren't stamped identically.
          boxShadow: done ? `${j.shadowX.toFixed(2)}px ${j.shadowY.toFixed(2)}px 0 ${EC.ink}` : "none",
          // Dashed (open) borders smear under heavy displacement — use the gentler waver.
          filter: done ? "url(#earned-rough)" : "url(#earned-rough-soft)",
          transition: "background 140ms ease, box-shadow 140ms ease",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "11px 13px",
        }}
      >
        <EarnedCheckbox
          state={state}
          onClick={isEditable ? onToggle : undefined}
          disabled={!isEditable}
          size={34}
          boxStroke={j.boxSw}
          label={`${done ? "mark incomplete" : "mark complete"}: ${name}`}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: HAND,
              fontWeight: 600,
              fontSize: 23,
              lineHeight: 1.08,
              color: EC.ink,
              textDecoration: state === "star" ? `underline wavy ${EC.gold}` : "none",
              textUnderlineOffset: 5,
              wordBreak: "break-word",
              // Per-row baseline + rotation jitter so titles don't look stamped.
              transform: `translateY(${j.titleDy.toFixed(2)}px) rotate(${j.titleRot.toFixed(2)}deg)`,
              transformOrigin: "left center",
            }}
          >
            {name}
          </div>
          {note && (
            <div
              style={{
                fontFamily: SANS,
                fontSize: 11,
                fontWeight: 500,
                color: "rgba(31,31,29,0.6)",
                marginTop: 2,
              }}
            >
              {note}
            </div>
          )}
        </div>
        {right && <div style={{ flexShrink: 0 }}>{right}</div>}
      </div>
    </div>
  );
}

/** Compact handwritten page header: date + "Day N of total". */
export function EarnedPageHeader({
  date,
  day,
  total,
  trailing,
}: {
  date: string;
  day: number;
  total?: number | null;
  trailing?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
      <div>
        <div style={{ fontFamily: HAND, fontWeight: 600, fontSize: 25, lineHeight: 1, color: EC.sky }}>
          {date}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          <span style={{ fontFamily: HAND, fontWeight: 600, fontSize: 23, color: "rgba(31,31,29,0.6)", lineHeight: 0.9 }}>
            Day
          </span>
          <span style={{ fontFamily: HAND, fontWeight: 700, fontSize: 62, lineHeight: 0.8, color: EC.ink }}>
            {day}
          </span>
          {total ? (
            <span style={{ fontFamily: HAND, fontWeight: 700, fontSize: 34, color: "rgba(70,54,24,0.72)", lineHeight: 0.85, marginLeft: -2 }}>
              / {total}
            </span>
          ) : null}
        </div>
      </div>
      {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
    </div>
  );
}

/** Handwritten sub-prompt line, e.g. "Today I'm showing up for —". */
export function EarnedPrompt({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: HAND,
        fontWeight: 500,
        fontSize: 21,
        color: "rgba(31,31,29,0.65)",
        lineHeight: 1.25,
      }}
    >
      {children}
    </div>
  );
}
