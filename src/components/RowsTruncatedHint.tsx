import { INLINE_GRID_NUDGE_TEXT } from '../constants/inlineGrid';

/**
 * Plain "view more" line shown below the inline grid when rows are
 * truncated. Rendered identically by both platforms — desktop
 * (`GridSlideNav`) and mobile (`DataView`) each decide independently
 * whether to show it (gated by their own last-slide/`hasMoreRows` check),
 * but the markup itself doesn't differ, so it lives in one place.
 */
export function RowsTruncatedHint() {
  return (
    <p className="mt-2 text-center text-xs text-neutrals-700">
      {INLINE_GRID_NUDGE_TEXT}
    </p>
  );
}
