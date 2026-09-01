import { ChevronLeftIcon, ChevronRightIcon } from '../icons/ChevronIcon';
import { Platform } from '../host/hostContext';
import { HostIconButton } from './HostIconButton';

const NUDGE_TEXT = 'To view more, open full view';

interface Props {
  activeSlide: number;
  slideCount: number;
  hasMoreBeyondSlides: boolean;
  showArrows: boolean;
  platform: Platform;
  onPrev: () => void;
  onNext: () => void;
}

/**
 * Column-slide navigation for the inline grid carousel. On desktop
 * (`showArrows`), renders floating prev/next arrows absolutely positioned
 * over the grid's row area, vertically centered. On the last reachable
 * slide, if the dataset needs more slides than the 3-slide budget allows,
 * the next arrow's position is replaced by a vertical "view more" hint
 * overlaid on the grid's trailing edge, plus a plain duplicate line of the
 * same text below the grid; both platforms render the nudge text
 * identically, only the arrows are desktop-only.
 *
 * The overlay piece (arrows + vertical hint) is wrapped in a `[grid-area:1/1]`
 * div so it shares the CSS grid cell the caller (`DataView`) places the
 * masked grid div in — that's what lets the vertical hint show in full,
 * uninset, even on a short (e.g. two-row) grid: an invisible, non-absolute
 * clone of the same text inside that div reports its full natural height,
 * growing the shared grid row to fit rather than letting the text spill
 * past a fixed-height container. The visible hint itself stays absolutely
 * positioned within that div for exact right-edge placement. The duplicate
 * `<p>` line is a separate, unpositioned sibling — CSS grid's default
 * auto-placement puts it in the next row on its own, below that cell, same
 * as before. That `[grid-area:1/1]` div now covers the ENTIRE grid area
 * (not just where a button/hint happens to render), so it carries
 * `pointer-events-none` — without it, this div (even fully empty, e.g. a
 * mobile middle slide with no arrows and no nudge) would sit on top of the
 * masked grid div and swallow every touch event before the swipe gesture
 * handlers on that div ever saw them. Each button re-enables
 * `pointer-events-auto` on itself so it stays clickable.
 * @param activeSlide - Zero-based index of the currently visible slide.
 * @param slideCount - Total number of slides the current dataset was binned into (capped at `MAX_INLINE_SLIDES`).
 * @param hasMoreBeyondSlides - Whether the dataset has columns that didn't fit within the slide budget at all.
 * @param showArrows - Whether to render the floating arrow buttons — `true` on desktop, `false` on mobile (swipe-only there).
 * @param platform - The desktop/mobile bucket derived from the host context; sizes the arrow icons and their mobile hit-slop.
 * @param onPrev - Called to go to the previous slide.
 * @param onNext - Called to go to the next slide.
 */
export function GridSlideNav({
  activeSlide,
  slideCount,
  hasMoreBeyondSlides,
  showArrows,
  platform,
  onPrev,
  onNext,
}: Props) {
  const isLastSlide = activeSlide === slideCount - 1;
  const showNudge = isLastSlide && hasMoreBeyondSlides;

  if (slideCount <= 1 && !showNudge) return null;

  return (
    <>
      <div className="pointer-events-none relative [grid-area:1/1]">
        {showArrows && activeSlide > 0 && (
          <HostIconButton
            icon={ChevronLeftIcon}
            platform={platform}
            onClick={onPrev}
            ariaLabel="Previous slide"
            variant="floating"
            className="pointer-events-auto absolute left-2 top-1/2 -translate-y-1/2"
          />
        )}
        {showArrows && !isLastSlide && (
          <HostIconButton
            icon={ChevronRightIcon}
            platform={platform}
            onClick={onNext}
            ariaLabel="Next slide"
            variant="floating"
            className="pointer-events-auto absolute right-2 top-1/2 -translate-y-1/2"
          />
        )}
        {showNudge && (
          <>
            {/* Invisible, non-absolute clone: its natural (unclamped) height
                is what actually grows the shared grid row via this div. */}
            <span
              aria-hidden
              className="invisible inline-block whitespace-nowrap p-2 text-xs"
              style={{ writingMode: 'vertical-rl' }}
            >
              {NUDGE_TEXT}
            </span>
            <span
              className="absolute right-2 top-1/2 -translate-y-1/2 whitespace-nowrap text-xs text-neutrals-700"
              style={{ writingMode: 'vertical-rl' }}
            >
              {NUDGE_TEXT}
            </span>
          </>
        )}
      </div>
      {showNudge && (
        <p className="mt-2 text-center text-xs text-neutrals-700">
          {NUDGE_TEXT}
        </p>
      )}
    </>
  );
}
