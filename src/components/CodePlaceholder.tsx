import { SHIMMER_CLASSES } from '../constants/shimmer';

const ROW_MAX_WIDTHS = ['40%', '75%', '50%', '85%'];

/**
 * Skeleton placeholder shown while the Monaco Code tab bundle is loading —
 * four shimmering rows, each a bullet plus a bar of varying width, mimicking
 * lines of code. Replaces the previous spinner in the tab's Suspense fallback.
 */
export function CodePlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex w-full flex-col justify-center gap-4"
    >
      {ROW_MAX_WIDTHS.map((maxWidth, index) => (
        <div
          key={index}
          data-testid="placeholder-row"
          className="flex items-center gap-3"
        >
          <div
            data-testid="placeholder-bullet"
            className={`h-4 w-8 shrink-0 rounded-full ${SHIMMER_CLASSES}`}
          />
          <div
            data-testid="placeholder-bar"
            className={`h-4 flex-1 rounded-md ${SHIMMER_CLASSES}`}
            style={{ maxWidth }}
          />
        </div>
      ))}
    </div>
  );
}
