import { INLINE_GRID_NUDGE_TEXT } from '../constants/inlineGrid';
import { RowsTruncatedHint } from './RowsTruncatedHint';

interface Props {
  activeSlide: number;
  slideCount: number;
  hasMoreBeyondSlides: boolean;
  hasMoreRows: boolean;
}

/**
 * Column-truncation hint for the inline grid carousel, identical on both
 * platforms — arrow-button navigation and the header row that holds it
 * live in `DataView`'s new header row, not here.
 *
 * Two independent hints, both shown only on the last reachable slide, but
 * each gated by its own kind of truncation — a dataset can have more
 * columns than fit, more rows than fit, both, or neither. The vertical
 * hint (overlaid on the grid's trailing edge) shows when the dataset needs
 * more slides than the budget allows (`hasMoreBeyondSlides`) — more
 * COLUMNS exist. The plain duplicate line below the grid shows when there
 * are more ROWS than the row cap displays (`hasMoreRows`) — independent of
 * whether columns are also truncated.
 *
 * The vertical hint's wrapper shares the caller's `[grid-area:1/1]` cell
 * (`DataView` places the masked grid div in the same cell) — that's what
 * lets the hint show in full, uninset, even on a short (e.g. two-row)
 * grid: an invisible, non-absolute clone of the same text inside that div
 * reports its full natural height, growing the shared grid row to fit
 * rather than letting the text spill past a fixed-height container. The
 * visible hint itself stays absolutely positioned within that div for
 * exact right-edge placement. The duplicate `<p>` line (`RowsTruncatedHint`)
 * is a separate, unpositioned sibling — CSS grid's default auto-placement
 * puts it in the next row on its own, below that cell.
 * @param activeSlide - Zero-based index of the currently visible slide.
 * @param slideCount - Total number of slides the current dataset was binned into (capped at `MAX_INLINE_SLIDES`).
 * @param hasMoreBeyondSlides - Whether the dataset has columns that didn't fit within the slide budget at all — gates the vertical hint.
 * @param hasMoreRows - Whether the dataset has more rows than the row cap displays — gates the plain duplicate line below the grid, independent of `hasMoreBeyondSlides`.
 */
export function GridSlideNav({
  activeSlide,
  slideCount,
  hasMoreBeyondSlides,
  hasMoreRows,
}: Props) {
  const isLastSlide = activeSlide === slideCount - 1;
  const showNudge = isLastSlide && hasMoreBeyondSlides;
  const showRowsLine = isLastSlide && hasMoreRows;

  if (!showNudge && !showRowsLine) return null;

  return (
    <>
      {showNudge && (
        <div className="pointer-events-none relative [grid-area:1/1]">
          {/* Invisible, non-absolute clone: its natural (unclamped) height
              is what actually grows the shared grid row via this div. */}
          <span
            aria-hidden
            className="invisible inline-block whitespace-nowrap p-2 text-xs"
            style={{ writingMode: 'vertical-rl' }}
          >
            {INLINE_GRID_NUDGE_TEXT}
          </span>
          <span
            className="absolute right-1 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-neutrals-700"
            style={{ writingMode: 'vertical-rl' }}
          >
            {INLINE_GRID_NUDGE_TEXT}
          </span>
        </div>
      )}
      {showRowsLine && <RowsTruncatedHint />}
    </>
  );
}
