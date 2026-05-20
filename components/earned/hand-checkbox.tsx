"use client";

import { motion, useReducedMotion } from "framer-motion";

// Hand-drawn checkbox with three states:
//   - empty:  hand-trembled outline, no fill
//   - star:   gold fill with an inset hand-drawn star
//   - locked: dashed sage outline, read-only (past days / disabled rows)
//
// Motion (iter-010): when state transitions empty → star, the inner
// star path scales + fades in over 300ms then the button
// paper-crinkles via a 1.0 → 1.02 → 1.0 scale keyframe. (The path
// is fill-only with no stroke, so pathLength stroke-on doesn't
// produce a visible effect — opacity+scale is the honest equivalent.)
// Reduced-motion users get the final state with no animation.

export type HandCheckboxState = "empty" | "star" | "locked";

export function HandCheckbox({
  state,
  size = 36,
  onClick,
  disabled,
  label,
}: {
  state: HandCheckboxState;
  size?: number;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
}) {
  // `locked` is contractually read-only — make it self-disabling so callers
  // can't accidentally wire an onClick that fires when the state says it
  // shouldn't.
  const isLocked = state === "locked";
  const isDisabled = disabled || isLocked;
  const ink = "var(--earned-ink, #1F1F1D)";
  const gold = "var(--earned-star-gold, #D8A830)";
  const sage = "var(--earned-sage, #7A8C6B)";
  const shouldReduceMotion = useReducedMotion();
  const isChecked = state === "star";

  return (
    <motion.button
      type="button"
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      aria-label={label}
      aria-pressed={isChecked}
      // Paper-crinkle on tick: 1.0 → 1.02 → 1.0 over 400ms. initial=false
      // so the keyframe only fires on state changes, not on mount.
      animate={
        shouldReduceMotion
          ? { scale: 1 }
          : { scale: isChecked ? [1, 1.02, 1] : 1 }
      }
      initial={false}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        width: size,
        height: size,
        padding: 0,
        background: "transparent",
        border: "none",
        cursor: isDisabled ? "default" : "pointer",
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 36 36" width={size} height={size} style={{ display: "block" }}>
        <path
          d="M4 5 C 14 3, 28 4, 33 6 C 33.5 16, 33 26, 32 32 C 22 33, 10 33, 4 31 C 3 22, 3.5 12, 4 5 Z"
          fill={isChecked ? gold : "none"}
          stroke={state === "locked" ? sage : ink}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={state === "locked" ? "3 3" : "none"}
        />
        {isChecked && (
          <motion.path
            d="M18 6 L21 14 L29 15 L23 20 L25 28 L18 24 L11 28 L13 20 L7 15 L15 14 Z"
            fill={ink}
            // Star appears + settles: opacity 0 → 1 with a slight
            // scale overshoot (0.5 → 1.05 → 1). Origin is the path
            // centroid (about 18,17 in viewBox units) — we set
            // transform-box to fill-box so the SVG path scales
            // around its own bounding box rather than the SVG root.
            style={{ transformOrigin: "18px 17px", transformBox: "fill-box" }}
            initial={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 0, scale: 0.5 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 1, scale: [0.5, 1.05, 1] }
            }
            transition={{
              duration: shouldReduceMotion ? 0 : 0.3,
              times: shouldReduceMotion ? [0, 1] : [0, 0.7, 1],
              ease: "easeOut",
            }}
          />
        )}
      </svg>
    </motion.button>
  );
}
