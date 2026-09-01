import {
  INLINE_GRID_NUDGE_TEXT,
  MOBILE_GRID_NUDGE_COLUMN_WIDTH,
} from '../constants/inlineGrid';

interface Props {
  activeSlide: number;
  slideCount: number;
  hasMoreBeyondSlides: boolean;
}

/**
 * Mobile's version of the "view more" hint. Unlike desktop's overlay (see
 * `GridSlideNav`) — which reads fine layered over the grid's own edge-mask
 * shadow — mobile has no shadow to soften an overlay against, so the hint
 * instead sits in its own narrow column beside the grid, not over it: a
 * plain flex sibling, not an absolutely-positioned overlay. That means no
 * `[grid-area:1/1]`/invisible-sizing-clone trick is needed either — as an
 * ordinary flex item next to the grid div, the row's height already comes
 * out to the taller of the two for free.
 *
 * Renders nothing when there's no next-slide overflow to hint at — but the
 * caller (`DataView`) always reserves `MOBILE_GRID_NUDGE_COLUMN_WIDTH` of
 * page-budget space for it regardless, so the grid's own measured width
 * (and therefore its page layout) never shifts depending on whether this
 * column happens to be mounted on the current slide. `DataView` also
 * renders the plain duplicate line below the whole row itself (this
 * component only owns the column).
 * @param activeSlide - Zero-based index of the currently visible page.
 * @param slideCount - Total number of pages the current dataset was split into (capped at `MAX_INLINE_SLIDES`).
 * @param hasMoreBeyondSlides - Whether the dataset has columns that didn't fit within the page budget at all.
 */
export function MobileGridNudge({
  activeSlide,
  slideCount,
  hasMoreBeyondSlides,
}: Props) {
  const isLastSlide = activeSlide === slideCount - 1;
  const showNudge = isLastSlide && hasMoreBeyondSlides;

  if (!showNudge) return null;

  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: MOBILE_GRID_NUDGE_COLUMN_WIDTH }}
    >
      <span
        className="whitespace-nowrap text-xs text-neutrals-700"
        style={{ writingMode: 'vertical-rl' }}
      >
        {INLINE_GRID_NUDGE_TEXT}
      </span>
    </div>
  );
}
