import { useCallback, useRef, useState } from 'react';

/**
 * Measures an element's live rendered width via `ResizeObserver` — used
 * instead of `hostContext.containerDimensions` because that value isn't
 * reliable for this purpose (e.g. Claude sends a sentinel `maxHeight: 5000`
 * for "no limit" in fullscreen; width has no such guarantee either).
 * Returns a ref callback to attach to the element and its current width in
 * px, `0` before the first measurement.
 */
export function useElementWidth<T extends HTMLElement>(): [
  (node: T | null) => void,
  number,
] {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);

  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, width];
}
