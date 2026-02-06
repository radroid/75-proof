"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
}

const colors = [
  "oklch(0.650 0.200 155)", // emerald
  "oklch(0.700 0.150 175)", // teal
  "oklch(0.800 0.150 85)",  // amber
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
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    delay: Math.random() * 0.3,
    rotation: Math.random() * 360,
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
        <div
          className="h-3 w-3 rounded-sm"
          style={{ backgroundColor: color }}
        />
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

export function Confetti({ isActive, duration = 3000 }: ConfettiProps) {
  const [particles, setParticles] = React.useState<Particle[]>([]);
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    if (isActive) {
      setParticles(generateParticles(50));
      setShow(true);

      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration]);

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute"
              style={{ left: `${particle.x}%` }}
              initial={{
                y: -20,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                y: "100vh",
                opacity: 0,
                rotate: particle.rotation + 720,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2.5 + Math.random() * 1.5,
                delay: particle.delay,
                ease: [0.23, 0.03, 0.38, 1],
              }}
            >
              <ParticleShape shape={particle.shape} color={particle.color} />
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger confetti
export function useConfetti() {
  const [isActive, setIsActive] = React.useState(false);

  const trigger = React.useCallback(() => {
    setIsActive(true);
    // Reset after animation
    setTimeout(() => setIsActive(false), 100);
  }, []);

  return { isActive, trigger };
}
