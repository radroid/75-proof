"use client";

/*
 * Paper background primitives — the ruled cream notebook surface and the hidden
 * SVG filter defs that give plain CSS borders their hand-drawn waver. Relocated
 * verbatim from EarnedPaper.tsx (Wave A); behaviour unchanged.
 */
import * as React from "react";
import { EC } from "./tokens";

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
