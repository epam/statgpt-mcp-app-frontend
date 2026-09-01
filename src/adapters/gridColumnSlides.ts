import type { ColDef } from 'ag-grid-community';
import { Platform } from '../host/hostContext';
import {
  INLINE_IDENTITY_COLUMN_WIDTH,
  INLINE_VALUE_COLUMN_WIDTH,
  MAX_INLINE_SLIDES,
} from '../constants/inlineGrid';

const PEEK_COLUMN_CLASS = 'mcp-peek-column';

/**
 * Mirrors the shared grid component's own un-exported `MOBILE_GRID_COLUMN_WIDTH`
 * (`applyMobileColumnWidth` in `constants/grid.ts` there) — that component
 * decides its own mobile clamp from `window.innerWidth` alone (via its own
 * `useIsMobile`), independent of the `platform` this widget was told by its
 * host. When the two disagree (host says desktop, but the actual viewport is
 * narrow), its clamp still fires and silently shrinks every column to this
 * width — this constant lets `columnWidth` predict that outcome instead of
 * budgeting slides against a width that won't actually render.
 */
const SHARED_GRID_MOBILE_CLAMP_WIDTH = 100;

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

function columnWidth(
  col: ColDef,
  platform: Platform,
  viewportIsMobile: boolean,
): number {
  const width = isIdentityColumn(col)
    ? INLINE_IDENTITY_COLUMN_WIDTH[platform]
    : INLINE_VALUE_COLUMN_WIDTH[platform];
  return viewportIsMobile
    ? Math.min(width, SHARED_GRID_MOBILE_CLAMP_WIDTH)
    : width;
}

function mergeCellClass(
  existing: ColDef['cellClass'],
  addition: string,
): ColDef['cellClass'] {
  if (Array.isArray(existing)) return [...existing, addition];
  if (typeof existing === 'string') return [existing, addition];
  if (existing === undefined) return [addition];
  return existing;
}

function mergeHeaderClass(
  existing: ColDef['headerClass'],
  addition: string,
): ColDef['headerClass'] {
  if (Array.isArray(existing)) return [...existing, addition];
  if (typeof existing === 'string') return [existing, addition];
  if (existing === undefined) return [addition];
  return existing;
}

export interface ColumnSlides {
  columns: ColDef[];
  slideCount: number;
  hasMoreBeyondSlides: boolean;
  hasPeekLeft: boolean;
  hasPeekRight: boolean;
  activeSlide: number;
}

/**
 * Bins `columns` into up to `MAX_INLINE_SLIDES` fixed-width buckets that fit
 * `availableWidthPx`, in original column order. Three columns never
 * participate in paging: the chart column (always excluded, always hidden),
 * and any column that arrives with `hide: true` already set (excluded from
 * both bucketing and the width budget, left untouched, permanently hidden).
 *
 * The last bucket "backfills" from the end of the previous bucket when its
 * own natural content doesn't fill `availableWidthPx` — columns are pulled
 * backward, one at a time, until the width budget is met or exhausted.
 * Those columns are shown on BOTH the previous slide and the last slide (an
 * overlap, not a boundary shift) — the standard "last page anchors to the
 * end of content" pagination pattern. Every other slide boundary is exactly
 * what the forward pass computes, unaffected by backfill.
 *
 * A right-side overflow column (the first column after the range's end) is
 * shown — on BOTH platforms — whenever one exists, filling the leftover
 * space at the end of a bucket instead of leaving it blank: it's genuinely
 * new content (the start of the next slide), just truncated here. Only
 * DESKTOP fades it (`mcp-peek-column`) and gets the container's edge mask
 * class (`hasPeekRight`, see `DataView.tsx`) — mobile shows it at full
 * opacity, un-masked, no button.
 *
 * A left-side overflow column (the last column before the range's start)
 * is DESKTOP ONLY, unlike the right side — it's the previous slide's own
 * already-fully-opaque last column, so on desktop it reads as "you already
 * saw this, here's the boundary" thanks to the same fade; without a fade,
 * mobile would just show an unexplained duplicate of something already
 * fully seen, so mobile skips it (and its width reservation in the forward
 * pass/backfill loop below) entirely, giving that width back to the
 * bucket's own new content instead. This is unaffected by backfill either
 * way: a slide's own overflow column is always about the column adjacent
 * to ITS OWN range, never about what an adjacent slide additionally
 * borrows.
 *
 * On the true last slide, the right-side overflow column works differently
 * when there's more data than `MAX_INLINE_SLIDES` allows
 * (`hasMoreBeyondSlides`) — on both platforms: rather than adding an extra
 * column beyond the width budget (which would overflow the container), the
 * LAST column already inside the budget is re-purposed as the overflow
 * column instead — excluded from the opaque range. On desktop this pairs
 * with `GridSlideNav`'s "view more" nudge text and the fade; on mobile
 * it's just a plain, un-faded truncated column, with no nudge. Either way
 * it keeps the whole slide's rendered width exactly what was already
 * computed to fit, so nothing is ever clipped or reachable only by
 * scrolling.
 *
 * `activeSlide` is clamped into `[0, slideCount - 1]` internally and
 * returned as the effective value actually used, so a caller whose own
 * state drifted out of range (e.g. after a resize shrinks `slideCount`)
 * self-corrects instead of rendering zero visible columns. When
 * `availableWidthPx` is not yet a positive number (e.g. before the first
 * `ResizeObserver` measurement), bucketing is skipped and every pageable
 * column is shown on a single slide.
 * @param columns - Raw column list, as received from `CrossDatasetGridAttachmentData`.
 * @param availableWidthPx - The inline grid's actual measured width; non-positive values are treated as "not yet measured."
 * @param activeSlide - Zero-based index of the currently visible slide; clamped into range internally.
 * @param platform - Desktop/mobile bucket; drives per-type column width, whether the right overflow column is faded/masked (desktop) or plain (mobile) — both platforms show it — and whether a left overflow column exists at all (desktop only). Does not by itself decide whether the *rendered* column will be narrower — see `viewportIsMobile`.
 * @param viewportIsMobile - Whether the shared grid component's own viewport-width check (`window.innerWidth` against its breakpoint, independent of `platform`) will clamp every column's rendered width — see `SHARED_GRID_MOBILE_CLAMP_WIDTH`.
 */
export function buildColumnSlides(
  columns: ColDef[],
  availableWidthPx: number,
  activeSlide: number,
  platform: Platform,
  viewportIsMobile: boolean,
): ColumnSlides {
  const chartColumns = columns.filter(isChartColumn);
  const permanentlyHidden = columns.filter(
    (col) => !isChartColumn(col) && col.hide === true,
  );
  const pageable = columns.filter(
    (col) => !isChartColumn(col) && col.hide !== true,
  );

  // Each bucket is a contiguous run of indices into `pageable`.
  const buckets: number[][] = [[]];
  const overflowIndices: number[] = [];

  if (availableWidthPx > 0) {
    let bucketWidth = 0;
    // Every bucket after the first renders with a left peek immediately
    // before it ON DESKTOP ONLY — a real, non-hidden column that shifts
    // this bucket's own content rightward by its width (AG Grid lays out
    // non-hidden columns left to right with no way to start one at a
    // negative offset, and horizontal scroll is disabled entirely). Mobile
    // skips this reservation: it doesn't fade its left-side overflow
    // column (see below), so re-showing a column that was ALREADY fully
    // opaque on the previous slide would just look like a plain, unexplained
    // repeat — better to give that width back to this bucket's own (new)
    // content instead. A right peek doesn't need this on either platform:
    // it renders AFTER this bucket's content and is expected to overflow
    // past the end, clipped there by design.
    let leftPeekReserve = 0;
    for (let i = 0; i < pageable.length; i++) {
      const width = columnWidth(pageable[i], platform, viewportIsMobile);
      const bucket = buckets[buckets.length - 1];
      const budget =
        platform === Platform.Mobile
          ? availableWidthPx
          : availableWidthPx - leftPeekReserve;
      const wouldOverflow = bucket.length > 0 && bucketWidth + width > budget;

      if (wouldOverflow) {
        if (buckets.length < MAX_INLINE_SLIDES) {
          const lastOfBucket = bucket[bucket.length - 1];
          leftPeekReserve =
            platform === Platform.Mobile
              ? 0
              : columnWidth(pageable[lastOfBucket], platform, viewportIsMobile);
          buckets.push([]);
          bucketWidth = 0;
        } else {
          overflowIndices.push(i);
          continue;
        }
      }

      buckets[buckets.length - 1].push(i);
      bucketWidth += width;
    }
  } else {
    for (let i = 0; i < pageable.length; i++) buckets[0].push(i);
  }

  const hasMoreBeyondSlides = overflowIndices.length > 0;
  const effectiveActiveSlide = Math.min(
    Math.max(activeSlide, 0),
    buckets.length - 1,
  );

  const lastBucketIdx = buckets.length - 1;
  const lastBucket = buckets[lastBucketIdx];
  let lastBucketStart = lastBucket[0] ?? 0;
  const lastBucketEnd = lastBucket[lastBucket.length - 1] ?? -1;

  if (availableWidthPx > 0 && buckets.length >= 2 && lastBucketEnd >= 0) {
    let width = 0;
    for (let i = lastBucketStart; i <= lastBucketEnd; i++) {
      width += columnWidth(pageable[i], platform, viewportIsMobile);
    }
    let borrowIdx = lastBucketStart - 1;
    while (borrowIdx >= 0) {
      const candidateWidth = columnWidth(
        pageable[borrowIdx],
        platform,
        viewportIsMobile,
      );
      // Pulling this column in moves the left peek one column further back
      // (to `borrowIdx - 1`) — reserve its width too, or the new opaque
      // range plus its own left peek could still overflow the container.
      // Desktop only — see the forward pass above for why mobile skips
      // this reservation entirely.
      const newLeftPeekIdx = borrowIdx - 1;
      const newLeftPeekWidth =
        platform !== Platform.Mobile && newLeftPeekIdx >= 0
          ? columnWidth(pageable[newLeftPeekIdx], platform, viewportIsMobile)
          : 0;
      if (width + candidateWidth + newLeftPeekWidth > availableWidthPx) break;
      width += candidateWidth;
      lastBucketStart = borrowIdx;
      borrowIdx -= 1;
    }
  }

  function rangeOf(bucketIdx: number): { start: number; end: number } {
    if (bucketIdx === lastBucketIdx) {
      return { start: lastBucketStart, end: lastBucketEnd };
    }
    const bucket = buckets[bucketIdx];
    return { start: bucket[0], end: bucket[bucket.length - 1] };
  }

  const { start: displayStart, end: displayEnd } =
    rangeOf(effectiveActiveSlide);

  // On the last slide, when there's more data than `MAX_INLINE_SLIDES`
  // allows, the peek is NOT an extra column beyond the width budget (that
  // would overflow the container — the earlier approach here, which relied
  // on CSS clipping/scroll-locking to hide the overflow). Instead, the last
  // column already inside the budget is re-purposed as the peek: it's
  // excluded from the opaque/visible range and shown faded instead,
  // shrinking the real content by exactly one column so the peek + its
  // `GridSlideNav` "view more" nudge fit within the same total width that
  // was already computed to fit the container.
  const isLastSlideWithOverflow =
    effectiveActiveSlide === lastBucketIdx && hasMoreBeyondSlides;
  const rightOverflowIndex = isLastSlideWithOverflow
    ? displayEnd
    : displayEnd + 1;
  const visibleEnd = isLastSlideWithOverflow ? displayEnd - 1 : displayEnd;
  const leftOverflowIndex = displayStart - 1;
  // Right side: platform-agnostic. Does the next column exist? This alone
  // decides whether it's VISIBLE (`hide`, below) — mobile shows it too
  // (truncated, no fade), filling the leftover space at the end of a
  // bucket instead of leaving it blank. It's genuinely new content (the
  // start of the next slide), not yet fully shown, so repeating a sliver
  // of it here isn't a real repeat.
  const hasRightOverflow = rightOverflowIndex < pageable.length;
  // Left side: desktop only. Unlike the right side, this column was
  // already fully opaque on the PREVIOUS slide (see the forward-pass
  // comment above) — on desktop that's fine because it's faded, reading as
  // "you already saw this, here's the boundary." Mobile has no fade, so
  // showing it again would just look like an unexplained duplicate; mobile
  // skips it (and its width reservation) entirely instead.
  const hasPeekLeft = platform !== Platform.Mobile && leftOverflowIndex >= 0;
  // Desktop-only: whether to fade the right overflow cell
  // (`mcp-peek-column`) and whether the caller (`DataView`) should apply
  // the container's edge mask — mobile's equivalent column shows at full
  // opacity, un-masked.
  const hasPeekRight = platform !== Platform.Mobile && hasRightOverflow;

  const pagedColDefs = pageable.map((col, i) => {
    const width = columnWidth(col, platform, viewportIsMobile);
    const isRightOverflowCol = hasRightOverflow && i === rightOverflowIndex;
    const isLeftOverflowCol = hasPeekLeft && i === leftOverflowIndex;
    const isOverflowCol = isRightOverflowCol || isLeftOverflowCol;
    const isPeekStyled =
      (hasPeekRight && isRightOverflowCol) || isLeftOverflowCol;
    const visible = i >= displayStart && i <= visibleEnd;
    return {
      ...col,
      flex: undefined,
      width,
      minWidth: width,
      maxWidth: width,
      hide: !visible && !isOverflowCol,
      ...(isPeekStyled
        ? {
            cellClass: mergeCellClass(col.cellClass, PEEK_COLUMN_CLASS),
            headerClass: mergeHeaderClass(col.headerClass, PEEK_COLUMN_CLASS),
          }
        : {}),
    };
  });

  return {
    columns: [
      ...pagedColDefs,
      ...chartColumns.map((col) => ({ ...col, hide: true })),
      ...permanentlyHidden,
    ],
    slideCount: buckets.length,
    hasMoreBeyondSlides,
    hasPeekLeft,
    hasPeekRight,
    activeSlide: effectiveActiveSlide,
  };
}

/** Slices `data` to `min(cap, data.length)` rows — no residual rows for AG Grid to scroll. */
export function sliceInlineRows<T>(data: T[], cap: number): T[] {
  return data.slice(0, Math.min(cap, data.length));
}
