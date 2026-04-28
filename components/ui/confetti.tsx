"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const colors = [
  "oklch(0.650 0.200 155)", // emerald
  "oklch(0.700 0.150 175)", // teal
  "oklch(0.800 0.150 85)", // amber
  "oklch(0.700 0.150 250)", // blue
  "oklch(0.750 0.180 155)", // lime
];

const shapes = ["circle", "square", "triangle"] as const;

interface Particle {
  id: number;
  x: number;
  color: string;
  shape: (typeof shapes)[number];
  delay: number;
  rotation: number;
  /** Frozen-at-creation duration so the same particle doesn't re-randomize on re-renders. */
  duration: number;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
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
export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  // Re-key the particle set on every activation so AnimatePresence treats
  // back-to-back triggers as fresh mounts (otherwise the second activation
  // re-runs the same animation on the same nodes and looks half-baked).
  const [activation, setActivation] = React.useState(0);
  const [running, setRunning] = React.useState(false);

  React.useEffect(() => {
    if (!isActive) return;
    setActivation((n) => n + 1);
    setRunning(true);
    const timer = setTimeout(() => setRunning(false), duration);
    return () => clearTimeout(timer);
  }, [isActive, duration]);

  // SSR-safe portal: only render on the client where `document` exists.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const particles = React.useMemo(
    () => (activation > 0 ? generateParticles(50) : []),
    // Fresh particle set per activation; `running` flipping back to false
    // shouldn't regenerate them.
    [activation],
  );

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {running && (
        <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
          {particles.map((p) => (
            <motion.div
              key={`${activation}-${p.id}`}
              className="absolute"
              style={{ left: `${p.x}%`, top: 0 }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: "100dvh",
                opacity: 0,
                rotate: p.rotation + 720,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                ease: [0.23, 0.03, 0.38, 1],
              }}
            >
              <ParticleShape shape={p.shape} color={p.color} />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>,
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
