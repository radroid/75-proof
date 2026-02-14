"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSwipe } from "@/hooks/use-swipe";

interface SwipeableDayViewProps {
  displayDay: number;
  todayDayNumber: number;
  onDayChange: (day: number) => void;
  children: React.ReactNode;
}

const SLIDE_OFFSET = 80;

export function SwipeableDayView({
  displayDay,
  todayDayNumber,
  onDayChange,
  children,
}: SwipeableDayViewProps) {
  const prevDayRef = useRef(displayDay);
  const [direction, setDirection] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (displayDay !== prevDayRef.current) {
      setDirection(displayDay > prevDayRef.current ? 1 : -1);
      prevDayRef.current = displayDay;
    }
  }, [displayDay]);

  const handleSwipeLeft = useCallback(() => {
    // Swipe left → next day
    if (displayDay < todayDayNumber) {
      onDayChange(displayDay + 1);
    }
  }, [displayDay, todayDayNumber, onDayChange]);

  const handleSwipeRight = useCallback(() => {
    // Swipe right → previous day
    if (displayDay > 1) {
      onDayChange(displayDay - 1);
    }
  }, [displayDay, onDayChange]);

  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipe(
    handleSwipeLeft,
    handleSwipeRight
  );

  const variants = prefersReducedMotion
    ? {
        enter: {},
        center: {},
        exit: {},
      }
    : {
        enter: (dir: number) => ({
          x: dir > 0 ? SLIDE_OFFSET : -SLIDE_OFFSET,
          opacity: 0,
        }),
        center: {
          x: 0,
          opacity: 1,
        },
        exit: (dir: number) => ({
          x: dir > 0 ? -SLIDE_OFFSET : SLIDE_OFFSET,
          opacity: 0,
        }),
      };

  return (
    <div
      className="touch-pan-y overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={displayDay}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={
            prefersReducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 300, damping: 30 }
          }
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
