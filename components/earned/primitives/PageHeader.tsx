"use client";

/*
 * Page header primitives — the handwritten date + big day number header and the
 * sub-prompt line. Relocated verbatim from EarnedPaper.tsx (Wave A); visuals
 * unchanged.
 */
import * as React from "react";
import { EC, HAND } from "./tokens";

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
        <div style={{ fontFamily: HAND, fontWeight: 600, fontSize: 25, lineHeight: 1, color: EC.skyDeep }}>
          {date}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
          {/* Screen readers get one clean phrase; the stylized spans below are
              decorative (aria-hidden). Avoids role="text" (WebKit-only — on
              Firefox/NVDA it degrades to role=generic where the label is
              dropped, and with the spans hidden the header would vanish). */}
          <span className="sr-only">
            {total ? `Day ${day} of ${total}` : `Day ${day}`}
          </span>
          <span aria-hidden style={{ fontFamily: HAND, fontWeight: 600, fontSize: 23, color: "rgba(31,31,29,0.6)", lineHeight: 0.9 }}>
            Day
          </span>
          <span aria-hidden style={{ fontFamily: HAND, fontWeight: 700, fontSize: 62, lineHeight: 0.8, color: EC.ink }}>
            {day}
          </span>
          {total ? (
            <span aria-hidden style={{ fontFamily: HAND, fontWeight: 700, fontSize: 34, color: "rgba(70,54,24,0.72)", lineHeight: 0.85, marginLeft: -2 }}>
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
