"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Star } from "./star";

// Gold star with a 3-spoke ink burst that pops on mount — used for
// the all-done celebration on the EarnedDashboard. The star pops
// 0.9 → 1.2 → 1.0 over 550ms; three ink rays draw outward from the
// star's centre with stroke-dashoffset, peaking at 40% and fading
// out by 100%. Reduced-motion users see the static star with no
// rays — the design system rule for the no-spinners ethos: motion
// is communication, not decoration.

export function StarBurst({ size = 72 }: { size?: number }) {
  const shouldReduceMotion = useReducedMotion();
  // Burst frame is generous to fit the rays without clipping.
  const frame = size * 1.6;

  return (
    <div
      style={{
        position: "relative",
        width: frame,
        height: frame,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-hidden="false"
    >
      {!shouldReduceMotion && (
        <svg
          viewBox="-50 -50 100 100"
          width={frame}
          height={frame}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {/* 3 ray spokes at -90° (top), 30°, 150°. Each is a short
              ink line drawn from r=18 outward to r=40, with the line
              extending via stroke-dashoffset animation. */}
          {[-90, 30, 150].map((deg, i) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = Math.cos(rad) * 22;
            const y1 = Math.sin(rad) * 22;
            const x2 = Math.cos(rad) * 40;
            const y2 = Math.sin(rad) * 40;
            return (
              <motion.line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--earned-ink, #1F1F1D)"
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{
                  pathLength: [0, 1, 1],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 0.7,
                  times: [0, 0.4, 1],
                  ease: "easeOut",
                  delay: i * 0.04,
                }}
              />
            );
          })}
        </svg>
      )}

      <motion.div
        initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.9 }}
        animate={
          shouldReduceMotion ? { scale: 1 } : { scale: [0.9, 1.2, 1] }
        }
        transition={{
          duration: shouldReduceMotion ? 0 : 0.55,
          times: shouldReduceMotion ? [0, 1] : [0, 0.45, 1],
          ease: "easeOut",
        }}
      >
        <Star size={size} />
      </motion.div>
    </div>
  );
}
