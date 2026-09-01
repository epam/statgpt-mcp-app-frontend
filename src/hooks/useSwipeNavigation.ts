import { useRef } from 'react';
import { SWIPE_THRESHOLD_PX } from '../constants/inlineGrid';

/** Minimal structural shape this hook reads — see Task 4's Interfaces note for why this isn't the native `PointerEvent`. */
export interface PointerLike {
  clientX: number;
  clientY: number;
}

export interface SwipeHandlers {
  onPointerDown: (e: PointerLike) => void;
  onPointerMove: (e: PointerLike) => void;
  onPointerUp: (e: PointerLike) => void;
}

/**
 * Computes horizontal-swipe intent from raw pointer events and fires
 * `onPrev`/`onNext` once, on release — no live drag-follow, matching this
 * widget's existing instant-snap pager precedent (`ChartPager`). Only the
 * net delta between pointerdown and pointerup is used; movement that's
 * predominantly vertical, or below `SWIPE_THRESHOLD_PX` horizontally, fires
 * neither callback, leaving vertical pan gestures free to reach the host's
 * own conversation scroll (paired with `touch-action: pan-y` on the
 * element these handlers are attached to).
 * @param onPrev - Called once when a rightward swipe past the threshold is detected.
 * @param onNext - Called once when a leftward swipe past the threshold is detected.
 */
export function useSwipeNavigation(
  onPrev: () => void,
  onNext: () => void,
): SwipeHandlers {
  const start = useRef<{ x: number; y: number } | null>(null);
  const current = useRef<{ x: number; y: number } | null>(null);

  return {
    onPointerDown: (e) => {
      start.current = { x: e.clientX, y: e.clientY };
      current.current = start.current;
    },
    onPointerMove: (e) => {
      current.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: () => {
      const from = start.current;
      const to = current.current;
      start.current = null;
      current.current = null;
      if (!from || !to) return;

      const dx = to.x - from.x;
      const dy = to.y - from.y;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) {
        return;
      }
      if (dx < 0) onNext();
      else onPrev();
    },
  };
}
