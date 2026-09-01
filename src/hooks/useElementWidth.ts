import { useCallback, useRef, useState, type RefObject } from 'react';

/**
 * Measures an element's live rendered width via `ResizeObserver` — used
 * instead of `hostContext.containerDimensions` because that value isn't
 * reliable for this purpose (e.g. Claude sends a sentinel `maxHeight: 5000`
 * for "no limit" in fullscreen; width has no such guarantee either).
 * Returns a ref callback to attach to the element, its current width in px
 * (`0` before the first measurement), and a plain ref object holding the
 * element itself — needed by callers that must reach into the DOM directly
 * (e.g. to set `scrollLeft` on a descendant), since the callback ref alone
 * doesn't retain the node for later reads.
 */
export function useElementWidth<T extends HTMLElement>(): [
  (node: T | null) => void,
  number,
  RefObject<T | null>,
] {
  const [width, setWidth] = useState(0);
  const observerRef = useRef<ResizeObserver | null>(null);
  const nodeRef = useRef<T | null>(null);

  const ref = useCallback((node: T | null) => {
    observerRef.current?.disconnect();
    nodeRef.current = node;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return [ref, width, nodeRef];
}
