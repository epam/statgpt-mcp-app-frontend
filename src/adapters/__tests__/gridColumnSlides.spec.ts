import type { ColDef } from 'ag-grid-community';
import { MAX_INLINE_SLIDES } from '../../constants/inlineGrid';
import { buildColumnScrollPlan, sliceInlineRows } from '../gridColumnSlides';

function identityCol(colId: string): ColDef {
  return { colId, field: colId, flex: 1, minWidth: 200 };
}
function valueCol(colId: string): ColDef {
  return { colId, field: colId, width: 200 };
}
function chartCol(): ColDef {
  return { colId: 'Chart_column', pinned: 'right', width: 32, maxWidth: 32 };
}
function permanentlyHiddenCol(colId: string): ColDef {
  // Mirrors the shape of an "other dimension" column produced upstream —
  // identity-shaped (`flex: 1`) but already `hide: true`, meant to always
  // stay hidden.
  return { colId, field: colId, flex: 1, minWidth: 200, hide: true };
}

describe('sliceInlineRows', () => {
  it('slices to the cap when there are more rows than the cap', () => {
    expect(sliceInlineRows([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it('returns all rows unchanged when there are fewer than the cap', () => {
    expect(sliceInlineRows([1, 2], 6)).toEqual([1, 2]);
  });
});

describe('buildColumnScrollPlan', () => {
  it('puts everything on one page when it all fits, reports no overflow', () => {
    // 2 identity (220 each) + 2 value (130 each) = 700px, fits an 800px viewport.
    const cols = [
      identityCol('agency'),
      identityCol('dataset'),
      valueCol('2021'),
      valueCol('2022'),
    ];
    const result = buildColumnScrollPlan(cols, 800, false);
    expect(result.pageCount).toBe(1);
    expect(result.pageOffsets).toEqual([0]);
    expect(result.hasMoreBeyondSlides).toBe(false);
    const visible = result.columns.filter((c) => !c.hide);
    expect(visible.map((c) => c.colId)).toEqual([
      'agency',
      'dataset',
      '2021',
      '2022',
    ]);
  });

  it('excludes the chart column from both the width budget and visibility', () => {
    const cols = [identityCol('agency'), chartCol()];
    const result = buildColumnScrollPlan(cols, 800, false);
    const chart = result.columns.find((c) => c.colId === 'Chart_column');
    expect(chart?.hide).toBe(true);
  });

  it('splits into a second page, rewound by the fixed peek width, on both platforms', () => {
    // 4 value columns (130 each), 300px viewport: 2 fit per page (260px),
    // a 3rd would be 390px > 300px — raw page-2 boundary is 260, rewound by
    // min(30, 130) = 30, landing at 230.
    const cols = [
      valueCol('2021'),
      valueCol('2022'),
      valueCol('2023'),
      valueCol('2024'),
    ];
    const result = buildColumnScrollPlan(cols, 300, false);
    expect(result.pageCount).toBe(2);
    expect(result.pageOffsets).toEqual([0, 230]);
    expect(result.hasMoreBeyondSlides).toBe(false);
    const visible = result.columns.filter((c) => !c.hide);
    expect(visible.map((c) => c.colId)).toEqual([
      '2021',
      '2022',
      '2023',
      '2024',
    ]);
  });

  it('caps at MAX_INLINE_SLIDES pages and hides everything beyond, reporting hasMoreBeyondSlides', () => {
    // MAX_INLINE_SLIDES + 7 value columns (130 each), 150px viewport → exactly
    // 1 column per page (a 2nd would always exceed 150px) — MAX_INLINE_SLIDES
    // pages hold MAX_INLINE_SLIDES columns, the remaining 7 are hidden
    // entirely. Every page after the first is rewound by min(30, 130) = 30.
    // Sized off the actual constant (not a hardcoded page count) so this
    // stays correct whatever it's currently tuned to.
    const cols = Array.from({ length: MAX_INLINE_SLIDES + 7 }, (_, i) =>
      valueCol(`${2000 + i}`),
    );
    const result = buildColumnScrollPlan(cols, 150, false);
    expect(result.pageCount).toBe(MAX_INLINE_SLIDES);
    expect(result.pageOffsets).toEqual(
      Array.from({ length: MAX_INLINE_SLIDES }, (_, i) =>
        i === 0 ? 0 : i * 130 - 30,
      ),
    );
    expect(result.hasMoreBeyondSlides).toBe(true);
    const visible = result.columns.filter((c) => !c.hide).map((c) => c.colId);
    expect(visible).toEqual(
      Array.from({ length: MAX_INLINE_SLIDES }, (_, i) => `${2000 + i}`),
    );
  });

  it('keeps overflow exclusion a contiguous prefix — a narrow column after an excluded wide one must not become reachable', () => {
    // Builds MAX_INLINE_SLIDES pages, each holding exactly one column, so
    // that the last page's sole occupant is narrow (130), leaving 170px of
    // its 300px budget free. The next column ('wide', 220) legitimately
    // overflows that remaining budget and must be excluded once the page
    // cap is hit — but naively skipping just that one column, without
    // freezing the page's width/column-count, would leave the stale
    // (pre-exclusion) width in place. A still-later narrow column
    // ('afterWide', 130) would then fit into that same 170px and get
    // wrongly included, even though it comes after an excluded column.
    // `reachableCount` must stay a contiguous prefix of `pageable`, so both
    // 'wide' and 'afterWide' stay excluded regardless of 'afterWide's width.
    const prefix = Array.from({ length: MAX_INLINE_SLIDES - 1 }, (_, i) =>
      identityCol(`filler${i}`),
    );
    const cols = [
      ...prefix,
      valueCol('lastPageOccupant'),
      identityCol('wide'),
      valueCol('afterWide'),
    ];
    const result = buildColumnScrollPlan(cols, 300, false);
    expect(result.pageCount).toBe(MAX_INLINE_SLIDES);
    expect(result.hasMoreBeyondSlides).toBe(true);
    const visible = result.columns.filter((c) => !c.hide).map((c) => c.colId);
    expect(visible).toEqual([
      ...prefix.map((c) => c.colId),
      'lastPageOccupant',
    ]);
    expect(result.columns.find((c) => c.colId === 'wide')?.hide).toBe(true);
    expect(result.columns.find((c) => c.colId === 'afterWide')?.hide).toBe(
      true,
    );
  });

  describe('left-peek rewind', () => {
    it('rewinds each page after the first by the fixed rewind width, capped at the previous column width', () => {
      // 2 value columns (130 each), 150px viewport: raw boundary is 130.
      // Rewound by min(30, 130) = 30 → 100.
      const cols = [valueCol('2000'), valueCol('2001')];
      const result = buildColumnScrollPlan(cols, 150, false);
      expect(result.pageOffsets).toEqual([0, 100]);
    });
  });

  it('never un-hides a column that arrived already hidden, and excludes it from the width budget', () => {
    const cols = [
      identityCol('agency'),
      permanentlyHiddenCol('other-dim-1'),
      valueCol('2010'),
      valueCol('2011'),
    ];
    // Budget only fits agency+2010+2011 (220+130+130=480); if the hidden
    // column were budgeted too, this would need a 2nd page instead of 1.
    const result = buildColumnScrollPlan(cols, 480, false);
    expect(result.pageCount).toBe(1);
    const hiddenCol = result.columns.find((c) => c.colId === 'other-dim-1');
    expect(hiddenCol?.hide).toBe(true);
  });

  it('falls back to a single unpaginated page when viewportWidthPx is not yet measured (0 or negative)', () => {
    const cols = [
      identityCol('agency'),
      identityCol('dataset'),
      valueCol('2021'),
    ];
    const result = buildColumnScrollPlan(cols, 0, false);
    expect(result.pageCount).toBe(1);
    expect(result.pageOffsets).toEqual([0]);
    expect(result.hasMoreBeyondSlides).toBe(false);
    const visible = result.columns.filter((c) => !c.hide);
    expect(visible).toHaveLength(3);
  });

  it('clamps every column width to the shared clamp width when the viewport itself is narrow', () => {
    // Without the clamp, 2 identity columns (220 each) would need a 2nd
    // page at a 300px viewport; clamped to 100 each, both fit on page 1.
    const cols = [identityCol('agency'), identityCol('dataset')];
    const result = buildColumnScrollPlan(cols, 300, true);
    expect(result.pageCount).toBe(1);
  });
});
