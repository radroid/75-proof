"use client";

/*
 * EarnedChip — sticker chip with a hard ink offset shadow. Relocated verbatim
 * from EarnedPaper.tsx (Wave A); export name and visuals unchanged.
 */
import * as React from "react";
import { EC, SANS } from "./tokens";

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
