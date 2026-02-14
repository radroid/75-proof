import { useRef, useCallback } from "react";

const SWIPE_THRESHOLD = 50;
const MAX_VERTICAL = 100;
const DIRECTION_RATIO = 1.5;

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void): SwipeHandlers {
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = touch.clientX;
    currentY.current = touch.clientY;
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    currentX.current = touch.clientX;
    currentY.current = touch.clientY;
  }, []);

  const onTouchEnd = useCallback(() => {
    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;
    const absDX = Math.abs(deltaX);
    const absDY = Math.abs(deltaY);

    // Must meet horizontal threshold
    if (absDX < SWIPE_THRESHOLD) return;
    // Must not exceed vertical limit
    if (absDY > MAX_VERTICAL) return;
    // Horizontal must dominate vertical
    if (absDX < absDY * DIRECTION_RATIO) return;

    if (deltaX < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}
