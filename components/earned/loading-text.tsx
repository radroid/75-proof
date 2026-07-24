"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Handwritten "loading…" indicator for the Earned theme. Replaces
// Lucide's Loader2 spinner per the design-system rule "no spinners
// — when something's loading, a pen scribbles a small loop." The
// ellipsis dots animate one at a time (1 → 2 → 3 → 1) at a calm
// 360ms cadence so it reads as someone slowly tapping their pen on
// the page. Under `prefers-reduced-motion: reduce` the dots are
// static at 3, which still reads as "still loading" without
// triggering vestibular motion sensitivity.
//
// Stays compact (text-only) so it fits inline next to small labels
// like "loading…" in the recents sheet or the delete-confirm row.
// Uses var(--font-heading) (Caveat under Earned) for the word so it
// matches the rest of the handwritten chrome.

export function EarnedLoadingText({
  label = "loading",
  className,
  size = "sm",
  dotsOnly = false,
}: {
  label?: string;
  className?: string;
  size?: "sm" | "md";
  // When true, render only the animated dots — no visible word.
  // Use this for icon-only slots (e.g. icon-sized round buttons
  // mid-action) where there's no room for "loading…". The sr-only
  // status text is still rendered so screen-reader users hear "label,
  // please wait" once on mount.
  dotsOnly?: boolean;
}) {
  const [dots, setDots] = useState(3);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      setDots(3);
      return;
    }
    const id = window.setInterval(() => {
      setDots((d) => (d % 3) + 1);
    }, 360);
    return () => window.clearInterval(id);
  }, [reducedMotion]);

  // Accessibility note: we split the live region from the visible
  // text. Putting role="status" + aria-live="polite" on the visible
  // <span> caused some screen readers (Chromium-bug-prone JAWS/NVDA
  // permutations) to re-announce the label every time the ticking
  // dots invalidated the accessible name. The visible <span> is now
  // marked aria-hidden; a sibling sr-only <span> carries the static
  // label so the user hears "loading my pages, please wait" exactly
  // once when the indicator mounts.
  return (
    <>
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex items-baseline",
          size === "sm" ? "text-sm" : "text-base",
          className,
        )}
        style={{
          fontFamily: "var(--font-heading, inherit)",
          // Slight tracking so the trailing dots have breathing room.
          letterSpacing: "0.01em",
        }}
      >
        {!dotsOnly && label}
        <span>{".".repeat(dots)}</span>
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {label}, please wait
      </span>
    </>
  );
}
