"use client";

/*
 * HandButton — the one shared hand-drawn button in the "earned" system.
 *
 * Three inline-duplicated buttons (the day-stepper arrows, the counter +/−
 * steppers, and the "reset stars to a row" pill) all shared the same recipe:
 * an ink border on a creamLight fill, a hard offset ink shadow, the
 * `earned-rough-soft` waver filter, `touchAction: manipulation`, and a disabled
 * fade. This unifies them without changing any pixel each call site renders.
 *
 * It ALSO adds the visible focus ring the raw buttons lacked, via the global
 * `.earned-focusable:focus-visible` rule (2px solid var(--ring)) — the one
 * intentional behavioural improvement over the originals, and keyboard-only so
 * it never alters the default rendered state.
 */
import * as React from "react";
import { EC } from "./tokens";

export type HandButtonShape = "square" | "round" | "pill";

type HandButtonProps = {
  /** square → rounded-square (radius 8); round → circle; pill → rounded pill
   *  (sized by its own padding via `style`, not `size`). */
  shape?: HandButtonShape;
  /** Pixel width & height for `square`/`round`. Ignored by `pill`. */
  size?: number;
  disabled?: boolean;
  /** Opacity applied while disabled (0.3 default; steppers use 0.4). */
  disabledOpacity?: number;
  /** Keep the hard offset shadow while disabled (the steppers do). */
  keepShadowWhenDisabled?: boolean;
  /** Merged last, so call sites can layer on font/color/padding/gap. */
  style?: React.CSSProperties;
  className?: string;
  /** Required — every hand button must be labelled for assistive tech. */
  "aria-label": string;
  children?: React.ReactNode;
} & Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  "style" | "className" | "children" | "disabled"
>;

export function HandButton({
  shape = "square",
  size = 30,
  disabled = false,
  disabledOpacity = 0.3,
  keepShadowWhenDisabled = false,
  style,
  className,
  children,
  ...rest
}: HandButtonProps) {
  const showShadow = !disabled || keepShadowWhenDisabled;

  const base: React.CSSProperties = {
    border: `1.5px solid ${EC.ink}`,
    background: EC.creamLight,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: disabled ? "default" : "pointer",
    opacity: disabled ? disabledOpacity : 1,
    boxShadow: showShadow ? `1.5px 1.5px 0 ${EC.ink}` : "none",
    filter: "url(#earned-rough-soft)",
    touchAction: "manipulation",
    padding: 0,
    ...(shape === "pill"
      ? { borderRadius: 999 }
      : { width: size, height: size, borderRadius: shape === "round" ? 999 : 8 }),
  };

  return (
    <button
      type="button"
      disabled={disabled}
      className={className ? `earned-focusable ${className}` : "earned-focusable"}
      style={{ ...base, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
