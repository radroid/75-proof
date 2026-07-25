"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence, MotionConfig, useReducedMotion } from "framer-motion";
import { haptic } from "@/lib/haptics";

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  /**
   * Particle palette. Defaults to the earned identity (gold / ink / cream) so
   * a celebration reads as "earned a star" on cream paper, not the old arctic
   * emerald/amber/sky. Override for surfaces on a different background.
   */
  colors?: string[];
}

/** Earned celebration palette — gold star currency + ink, tuned for contrast
 *  on the cream paper surfaces where the confetti fires. */
const EARNED_COLORS = [
  "#D8A830", // gold — the star reward currency
  "#F2C94C", // light gold
  "#1F1F1D", // ink
  "#E8DEC4", // cream (dark) — quiet accent
];

const shapes = ["circle", "square", "triangle"] as const;

interface Particle {
  id: number;
  x: number;
  /** Vertical resting position (%) — only used by the reduced-motion still scatter. */
  y: number;
  color: string;
  shape: (typeof shapes)[number];
  delay: number;
  rotation: number;
  /** Frozen-at-creation duration so the same particle doesn't re-randomize on re-renders. */
  duration: number;
}

function generateParticles(count: number, colors: string[]): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 12 + Math.random() * 68,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    delay: Math.random() * 0.3,
    rotation: Math.random() * 360,
    duration: 2.5 + Math.random() * 1.5,
  }));
}

function ParticleShape({
  shape,
  color,
}: {
  shape: (typeof shapes)[number];
  color: string;
}) {
  switch (shape) {
    case "circle":
      return (
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
      );
    case "square":
      return (
        <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      );
    case "triangle":
      return (
        <div
          className="h-0 w-0 border-x-[6px] border-b-[10px] border-x-transparent"
          style={{ borderBottomColor: color }}
        />
      );
  }
}

/**
 * Confetti overlay. Portaled to `document.body` so the `position: fixed`
 * container is always relative to the viewport — rendering inline left it
 * inside an ancestor with a `transform`/`will-change`, which silently
 * promotes that ancestor to a containing block and pinned the particles to
 * mid-screen instead of the top.
 */
export function Confetti({
  isActive,
  duration = 3000,
  colors = EARNED_COLORS,
}: ConfettiProps) {
  // Re-key the particle set on every activation so AnimatePresence treats
  // back-to-back triggers as fresh mounts (otherwise the second activation
  // re-runs the same animation on the same nodes and looks half-baked).
  const [activation, setActivation] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  // The blanket `globals.css` reduced-motion rule only clamps CSS
  // animation-duration; it can't touch these JS-driven framer transforms, so
  // we guard here. Reduced-motion users get a still scatter that fades in
  // place (no falling, no spinning) instead of 50 flying particles.
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (!isActive) return;
    setActivation((n) => n + 1);
    setRunning(true);
    // Smooth long buzz to reinforce the visual celebration. `haptic`
    // already short-circuits on prefers-reduced-motion / disabled-in-
    // settings, so we don't need to gate the call here.
    haptic("celebration");
    const timer = setTimeout(() => setRunning(false), duration);
    return () => clearTimeout(timer);
  }, [isActive, duration]);

  const particles = React.useMemo(
    () => (activation > 0 ? generateParticles(50, colors) : []),
    // Fresh particle set per activation; `running` flipping back to false
    // shouldn't regenerate them. `colors` is a stable module constant by
    // default, so it doesn't churn the set.
    [activation, colors],
  );

  // SSR-safe portal: bail out when running on the server where `document`
  // doesn't exist. A typeof-check is enough — no extra render pass needed.
  if (typeof document === "undefined") return null;

  return createPortal(
    // `reducedMotion="user"` is a belt-and-suspenders backstop: even if a new
    // motion.div is added below without an explicit still variant, framer will
    // strip its transforms for reduced-motion users.
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {running && (
          <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={`${activation}-${p.id}`}
                className="absolute"
                style={{
                  left: `${p.x}%`,
                  top: shouldReduceMotion ? `${p.y}%` : 0,
                }}
                initial={{
                  y: shouldReduceMotion ? 0 : -20,
                  // Falling particles must start opaque (they fade to 0 as they
                  // fall). Only the reduced-motion still-scatter starts at 0 and
                  // fades IN via its [0,1,1,0] opacity keyframes.
                  opacity: shouldReduceMotion ? 0 : 1,
                  rotate: 0,
                }}
                animate={
                  shouldReduceMotion
                    ? { opacity: [0, 1, 1, 0], rotate: 0, y: 0 }
                    : { y: "100dvh", opacity: 0, rotate: p.rotation + 720 }
                }
                exit={{ opacity: 0 }}
                transition={{
                  duration: shouldReduceMotion ? duration / 1000 : p.duration,
                  delay: shouldReduceMotion ? 0 : p.delay,
                  ease: [0.23, 0.03, 0.38, 1],
                }}
              >
                <ParticleShape shape={p.shape} color={p.color} />
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </MotionConfig>,
    document.body,
  );
}

/**
 * Trigger hook. Single setState pulse — Confetti owns the duration timer
 * so callers don't need to think about animation length.
 */
export function useConfetti() {
  const [isActive, setIsActive] = React.useState(false);
  // Track the pending rAF id so consecutive triggers can cancel a stale
  // one before scheduling a new one, and so unmount cancels cleanly
  // (otherwise an in-flight rAF can call setIsActive after the component
  // is gone — React 18 will warn).
  const rafIdRef = React.useRef<number | null>(null);

  const trigger = React.useCallback(() => {
    // Reset to false then back to true so consecutive triggers re-fire.
    setIsActive(false);
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    // requestAnimationFrame ensures the false→true transition lands on a
    // separate render cycle — without it React batches the two updates and
    // the effect inside Confetti only sees `isActive` go true once total.
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      setIsActive(true);
    });
  }, []);

  React.useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, []);

  return { isActive, trigger };
}
