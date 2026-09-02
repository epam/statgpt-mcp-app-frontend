import { SHIMMER_CLASSES } from '../constants/shimmer';

const BLOCK_COUNT = 16;
const COLUMNS = 4;
const COLUMN_STAGGER_MS = 120;

/**
 * Skeleton placeholder shown before data is ready — a header row mirroring
 * the inline grid's own header (a label on the left, two arrow buttons on
 * the right), a 4x4 grid of pill blocks, and a footer row mirroring
 * `GridRowLimitFooter`'s layout (a row-count label on the left, a full-view
 * button on the right). Every block runs the same shimmer animation,
 * staggered by column so the highlight reads as one wave traveling
 * left-to-right across the grid rather than each block pulsing on its own.
 * Used for every loading state this widget has — connecting to the host
 * (display mode not yet known) and every display mode once it is.
 */
export function GridPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex w-full flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div
          data-testid="placeholder-header-label"
          className={`h-5 w-16 rounded-lg ${SHIMMER_CLASSES}`}
        />
        <div className="flex items-center gap-2">
          <div
            data-testid="placeholder-header-button"
            className={`size-8 rounded-md ${SHIMMER_CLASSES}`}
          />
          <div
            data-testid="placeholder-header-button"
            className={`size-8 rounded-md ${SHIMMER_CLASSES}`}
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: BLOCK_COUNT }, (_, index) => (
          <div
            key={index}
            data-testid="placeholder-block"
            className={`h-6 rounded-lg ${SHIMMER_CLASSES}`}
            style={{
              animationDelay: `${(index % COLUMNS) * COLUMN_STAGGER_MS}ms`,
            }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div
          data-testid="placeholder-footer-label"
          className={`h-4 w-24 rounded-lg ${SHIMMER_CLASSES}`}
        />
        <div
          data-testid="placeholder-footer-button"
          className={`h-8 w-32 rounded-md ${SHIMMER_CLASSES}`}
        />
      </div>
    </div>
  );
}
