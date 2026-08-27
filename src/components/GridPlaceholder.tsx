import { SHIMMER_CLASSES } from '../constants/shimmer';

const BLOCK_COUNT = 16;
const COLUMNS = 4;
const COLUMN_STAGGER_MS = 120;

/**
 * Skeleton placeholder shown before data is ready — a title bar followed by a
 * 4x4 grid of pill blocks. Every block runs the same shimmer animation,
 * staggered by column so the highlight reads as one wave traveling
 * left-to-right across the grid rather than each block pulsing on its own.
 * Used while connecting to the host (display mode not yet known), and as the
 * pip/fullscreen loading state once it is (`ChartPlaceholder` covers inline).
 */
export function GridPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex w-full flex-col gap-4"
    >
      <div
        data-testid="placeholder-title"
        className={`h-4 w-2/5 rounded-lg ${SHIMMER_CLASSES}`}
      />
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
    </div>
  );
}
