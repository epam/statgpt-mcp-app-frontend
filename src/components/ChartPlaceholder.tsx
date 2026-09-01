import { SHIMMER_CLASSES } from '../constants/shimmer';

const LEGEND_PILL_WIDTHS = ['w-16', 'w-20', 'w-12'];
const DIMENSION_ROW_COUNT = 2;
const STAGGER_MS = 40;
const DIMENSION_ROWS_START_DELAY = 12 * STAGGER_MS;

/**
 * Runs slightly slower than `GridPlaceholder`/`CodePlaceholder`'s shared 2s
 * default (`shimmer-wave` in `tailwind.config.js`) — this placeholder's
 * layout is taller, so a slower sweep reads better over more shapes.
 */
const SHIMMER_DURATION_MS = '2.5s';

/**
 * Skeleton placeholder mirroring inline mode's former chart-only layout
 * (`InlineDataHeader` + `ChartView`). No longer wired into `AppContent`
 * (inline mode now shows a grid, not a chart, and uses `GridPlaceholder`
 * instead) — kept in the codebase intentionally rather than deleted. Every
 * shape shares `GridPlaceholder`'s shimmer colors and gradient
 * (`SHIMMER_CLASSES`), just at a slightly slower pace (`SHIMMER_DURATION_MS`),
 * staggered top-to-bottom so the highlight reads as one wave traveling down
 * the layout.
 */
export function ChartPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex w-full flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div
            data-testid="placeholder-caption-line"
            className={`h-2.5 w-full rounded-md ${SHIMMER_CLASSES}`}
            style={{
              animationDuration: SHIMMER_DURATION_MS,
              animationDelay: `${0 * STAGGER_MS}ms`,
            }}
          />
          <div
            data-testid="placeholder-caption-line"
            className={`h-2.5 w-3/5 rounded-md ${SHIMMER_CLASSES}`}
            style={{
              animationDuration: SHIMMER_DURATION_MS,
              animationDelay: `${1 * STAGGER_MS}ms`,
            }}
          />
        </div>
        <div
          data-testid="placeholder-explore-button"
          className={`h-7 w-24 shrink-0 rounded-md ${SHIMMER_CLASSES}`}
          style={{
            animationDuration: SHIMMER_DURATION_MS,
            animationDelay: `${2 * STAGGER_MS}ms`,
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div
          data-testid="placeholder-chart-counter"
          className={`h-3 w-16 rounded-md ${SHIMMER_CLASSES}`}
          style={{
            animationDuration: SHIMMER_DURATION_MS,
            animationDelay: `${3 * STAGGER_MS}ms`,
          }}
        />
        <div className="flex gap-1.5">
          <div
            data-testid="placeholder-pager-button"
            className={`size-[22px] rounded-md ${SHIMMER_CLASSES}`}
            style={{
              animationDuration: SHIMMER_DURATION_MS,
              animationDelay: `${4 * STAGGER_MS}ms`,
            }}
          />
          <div
            data-testid="placeholder-pager-button"
            className={`size-[22px] rounded-md ${SHIMMER_CLASSES}`}
            style={{
              animationDuration: SHIMMER_DURATION_MS,
              animationDelay: `${5 * STAGGER_MS}ms`,
            }}
          />
        </div>
      </div>

      <div
        data-testid="placeholder-chart-canvas"
        className={`h-[140px] rounded-lg ${SHIMMER_CLASSES}`}
        style={{
          animationDuration: SHIMMER_DURATION_MS,
          animationDelay: `${6 * STAGGER_MS}ms`,
        }}
      />

      <div className="flex flex-wrap gap-2">
        {LEGEND_PILL_WIDTHS.map((width, index) => (
          <div
            key={index}
            data-testid="placeholder-legend-pill"
            className={`h-4 ${width} rounded-full ${SHIMMER_CLASSES}`}
            style={{
              animationDuration: SHIMMER_DURATION_MS,
              animationDelay: `${(7 + index) * STAGGER_MS}ms`,
            }}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: DIMENSION_ROW_COUNT }, (_, index) => (
          <div
            key={index}
            data-testid="placeholder-dimension-row"
            className="flex items-baseline gap-2"
          >
            <div
              className={`h-2.5 w-16 rounded-md ${SHIMMER_CLASSES}`}
              style={{
                animationDuration: SHIMMER_DURATION_MS,
                animationDelay: `${DIMENSION_ROWS_START_DELAY + index * 2 * STAGGER_MS}ms`,
              }}
            />
            <div
              className={`h-3 w-24 rounded-md ${SHIMMER_CLASSES}`}
              style={{
                animationDuration: SHIMMER_DURATION_MS,
                animationDelay: `${DIMENSION_ROWS_START_DELAY + (index * 2 + 1) * STAGGER_MS}ms`,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
