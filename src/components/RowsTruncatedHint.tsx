import { INLINE_GRID_NUDGE_TEXT } from '../constants/inlineGrid';

/**
 * Plain "view more" line shown below the inline grid when rows are
 * truncated, rendered by `GridSlideNav` (gated by its own last-slide/
 * `hasMoreRows` check) identically on both platforms.
 */
export function RowsTruncatedHint() {
  return (
    <p className="my-2 text-center text-xs text-neutrals-700">
      {INLINE_GRID_NUDGE_TEXT}
    </p>
  );
}
