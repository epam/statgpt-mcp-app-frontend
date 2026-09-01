import type { ColDef } from 'ag-grid-community';
import { Platform } from '../host/hostContext';
import {
  INLINE_IDENTITY_COLUMN_WIDTH,
  INLINE_VALUE_COLUMN_WIDTH,
  MAX_INLINE_SLIDES,
} from '../constants/inlineGrid';

/**
 * Mirrors the shared grid component's own un-exported `MOBILE_GRID_COLUMN_WIDTH`
 * (`applyMobileColumnWidth` in `constants/grid.ts` there) — that component
 * decides its own mobile clamp from `window.innerWidth` alone (via its own
 * `useIsMobile`), independent of the `platform` this widget was told by its
 * host. When the two disagree (host says desktop, but the actual viewport is
 * narrow), its clamp still fires and silently shrinks every column to this
 * width — this constant lets `columnWidth` predict that outcome instead of
 * budgeting pages against a width that won't actually render.
 */
const SHARED_GRID_MOBILE_CLAMP_WIDTH = 100;

/**
 * Desktop-only: how far each page after the first rewinds its `scrollLeft`
 * target before the natural column boundary, so a sliver of the previous
 * page's last column peeks out from under the container's edge-mask fade
 * (`grid.scss`) — kept well within that fade's own width so the peek stays
 * hidden under the shadow, never more. Mobile gets no rewind at all: its
 * pages start flush on the first column, no shadow, no peek.
 */
const LEFT_PEEK_REWIND_PX = 30;

/**
 * The shared grid component this widget renders through always produces
 * this right-pinned 32px chart column with no stable public identifier;
 * this is the only way to recognize and exclude it from outside that
 * component — mirrors `dropMetadataIconColumn`'s own heuristic in
 * `gridColumns.ts`.
 */
function isChartColumn(col: ColDef): boolean {
  return col.pinned === 'right' && col.width === 32 && col.maxWidth === 32;
}

/** Identity/dimension columns spread `GRID_COLUMN_FLEX` (`flex: 1`); value/time columns never set `flex`. */
function isIdentityColumn(col: ColDef): boolean {
  return typeof col.flex === 'number';
}

function columnWidth(col: ColDef, viewportIsMobile: boolean): number {
  const width = isIdentityColumn(col)
    ? INLINE_IDENTITY_COLUMN_WIDTH
    : INLINE_VALUE_COLUMN_WIDTH;
  return viewportIsMobile
    ? Math.min(width, SHARED_GRID_MOBILE_CLAMP_WIDTH)
    : width;
}

export interface ColumnScrollPlan {
  /**
   * Every column, at its natural width — `hide: true` only for the chart
   * column, columns that arrived already hidden, and genuine overflow
   * beyond `MAX_INLINE_SLIDES` pages' worth of content. Nothing else is
   * ever hidden: every reachable column renders exactly once, at all
   * times, regardless of which page is currently in view.
   */
  columns: ColDef[];
  /**
   * `scrollLeft` target for each page, `pageOffsets[0] === 0`. Length
   * equals `pageCount`. On mobile, every page starts flush on a column
   * boundary — never mid-column. On desktop, every page after the first is
   * rewound `LEFT_PEEK_REWIND_PX` earlier than that natural boundary, so a
   * sliver of the previous page's last column stays visible (and, via the
   * container's edge mask, shadowed) on the left — mirroring the
   * incidental crop that already happens on the right when a column
   * doesn't evenly fit the viewport.
   */
  pageOffsets: number[];
  /** At most `MAX_INLINE_SLIDES`. */
  pageCount: number;
  /**
   * Whether any pageable column exists beyond the `MAX_INLINE_SLIDES`-page
   * cutoff — those columns are hidden entirely, reachable only via
   * fullscreen.
   */
  hasMoreBeyondSlides: boolean;
}

/**
 * Computes where each page of a column carousel starts (`pageOffsets`), for
 * a caller that navigates by setting the grid's real `scrollLeft` to one of
 * those values — not by toggling which columns are hidden. Every column
 * within the reachable range keeps its natural width and is never hidden;
 * whatever the browser crops at the current scroll position IS the visual
 * boundary between pages, with no separate "peek"/backfill bookkeeping
 * needed to fake that effect.
 *
 * A single forward pass walks columns in order, accumulating width; when
 * the next column would overflow `viewportWidthPx` for the current page,
 * that column's cumulative offset becomes the next page's start. Capped at
 * `MAX_INLINE_SLIDES` pages — columns beyond that are hidden entirely
 * (`hasMoreBeyondSlides`), the same "fullscreen only beyond this" cutoff as
 * before, just measured continuously instead of in fixed buckets.
 *
 * When `viewportWidthPx` is not yet a positive number (e.g. before the
 * first `ResizeObserver` measurement), every pageable column is shown on a
 * single page (`pageCount: 1`, `pageOffsets: [0]`).
 * @param columns - Raw column list, as received from `CrossDatasetGridAttachmentData`.
 * @param viewportWidthPx - The inline grid's actual measured width; non-positive values are treated as "not yet measured."
 * @param platform - Desktop/mobile bucket; drives per-type column width (currently the same value on both platforms — see `inlineGrid.ts`). Does not by itself decide whether the *rendered* column will be narrower — see `viewportIsMobile`.
 * @param viewportIsMobile - Whether the shared grid component's own viewport-width check (`window.innerWidth` against its breakpoint, independent of `platform`) will clamp every column's rendered width — see `SHARED_GRID_MOBILE_CLAMP_WIDTH`.
 */
export function buildColumnScrollPlan(
  columns: ColDef[],
  viewportWidthPx: number,
  platform: Platform,
  viewportIsMobile: boolean,
): ColumnScrollPlan {
  const chartColumns = columns.filter(isChartColumn);
  const permanentlyHidden = columns.filter(
    (col) => !isChartColumn(col) && col.hide === true,
  );
  const pageable = columns.filter(
    (col) => !isChartColumn(col) && col.hide !== true,
  );

  const widths = pageable.map((col) => columnWidth(col, viewportIsMobile));

  const pageOffsets: number[] = [0];
  let hasMoreBeyondSlides = false;
  // How many of `pageable`, in order, actually got placed onto some page —
  // everything after this index overflowed past `MAX_INLINE_SLIDES` pages
  // and is hidden entirely.
  let reachableCount = 0;
  // Width of the column that ended each preceding page — indexed the same
  // as `pageOffsets` minus one (i.e. `lastColumnWidthBeforePage[k - 1]` is
  // the width of the column immediately before `pageOffsets[k]`'s natural,
  // un-rewound boundary). Only used for the desktop-only rewind below.
  const lastColumnWidthBeforePage: number[] = [];

  if (viewportWidthPx > 0) {
    let pageWidth = 0;
    let columnsOnPage = 0;
    let lastWidthOnPage = 0;
    // Once a column overflows past the last allowed page, every column after
    // it must stay hidden too — even a narrower one that would otherwise fit
    // in the stale `pageWidth` — so `reachableCount` stays a contiguous
    // prefix of `pageable` and `hide: i >= reachableCount` holds.
    let pastCapacity = false;
    for (let i = 0; i < widths.length; i++) {
      const width = widths[i];

      if (pastCapacity) {
        hasMoreBeyondSlides = true;
        continue;
      }

      const wouldOverflow =
        columnsOnPage > 0 && pageWidth + width > viewportWidthPx;

      if (wouldOverflow) {
        if (pageOffsets.length < MAX_INLINE_SLIDES) {
          const cumulativeOffset =
            pageOffsets[pageOffsets.length - 1] + pageWidth;
          lastColumnWidthBeforePage.push(lastWidthOnPage);
          pageOffsets.push(cumulativeOffset);
          pageWidth = 0;
          columnsOnPage = 0;
        } else {
          hasMoreBeyondSlides = true;
          pastCapacity = true;
          continue;
        }
      }

      pageWidth += width;
      columnsOnPage += 1;
      lastWidthOnPage = width;
      reachableCount += 1;
    }
  } else {
    reachableCount = widths.length;
  }

  if (platform !== Platform.Mobile) {
    for (let k = 1; k < pageOffsets.length; k++) {
      // Capped at the previous page's own last column width so the rewind
      // can never reach past it into an even earlier page — currently
      // unreachable in practice (every real column width is >= 100px, via
      // `SHARED_GRID_MOBILE_CLAMP_WIDTH`, always wider than
      // `LEFT_PEEK_REWIND_PX`), kept as a defensive bound in case that ever
      // changes.
      const rewind = Math.min(
        LEFT_PEEK_REWIND_PX,
        lastColumnWidthBeforePage[k - 1] ?? 0,
      );
      pageOffsets[k] = Math.max(pageOffsets[k - 1], pageOffsets[k] - rewind);
    }
  }

  const pagedColDefs = pageable.map((col, i) => {
    const width = widths[i];
    return {
      ...col,
      flex: undefined,
      width,
      minWidth: width,
      maxWidth: width,
      hide: i >= reachableCount,
    };
  });

  return {
    columns: [
      ...pagedColDefs,
      ...chartColumns.map((col) => ({ ...col, hide: true })),
      ...permanentlyHidden,
    ],
    pageOffsets,
    pageCount: pageOffsets.length,
    hasMoreBeyondSlides,
  };
}

/** No residual rows left for AG Grid to scroll. */
export function sliceInlineRows<T>(data: T[], cap: number): T[] {
  return data.slice(0, Math.min(cap, data.length));
}
