import { useEffect } from 'react';

/**
 * Claude.ai reads the iframe's `<html>` height directly from the DOM instead
 * of listening to the spec's `ui/notifications/size-changed` postMessage, so
 * it never learns about a content shrink from the SDK's `autoResize` alone —
 * that mechanism measures via a transient `max-content` override and then
 * restores the original inline style, leaving nothing persisted for Claude to
 * re-read. This hook mirrors the same measurement technique but writes the
 * result directly to `<html>.style.height` and leaves it there, so hosts that
 * read the DOM instead of the postMessage channel see the current height too.
 *
 * Only meant for inline display mode — pip/fullscreen size `#root` from
 * `containerDimensions`/`100dvh` via CSS, and an inline style here would
 * override those rules.
 */
export function useInlineHeightSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const html = document.documentElement;
    let frame = 0;

    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        html.style.height = 'max-content';
        const height = Math.ceil(html.getBoundingClientRect().height);
        html.style.height = `${height}px`;
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      html.style.height = '';
    };
  }, [enabled]);
}
