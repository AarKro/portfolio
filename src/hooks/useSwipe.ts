import { useRef, type PointerEvent as ReactPointerEvent } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  /** Minimum travel (px) on the dominant axis to count as a swipe */
  threshold?: number;
}

interface SwipeHandlers {
  onPointerDown: (event: ReactPointerEvent) => void;
  onPointerUp: (event: ReactPointerEvent) => void;
  onPointerCancel: () => void;
}

/**
 * Minimal pointer-based swipe detection — no dependency. Spread the returned
 * handlers onto an element; a quick drag past `threshold` fires the matching
 * direction. The dominant axis wins, so a vertical scroll never triggers a
 * horizontal swipe (and vice-versa). Mouse pointers are ignored on purpose:
 * a precise pointer has the buttons/keys, swipe is the touch affordance.
 */
export function useSwipe({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 45,
}: SwipeOptions): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (event) => {
      if (event.pointerType === 'mouse') return;
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event) => {
      const origin = start.current;
      start.current = null;
      if (!origin) return;
      const dx = event.clientX - origin.x;
      const dy = event.clientY - origin.y;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;
      if (Math.abs(dx) >= Math.abs(dy)) {
        (dx < 0 ? onSwipeLeft : onSwipeRight)?.();
      } else {
        (dy < 0 ? onSwipeUp : onSwipeDown)?.();
      }
    },
    onPointerCancel: () => {
      start.current = null;
    },
  };
}
