import type { ColDef } from 'ag-grid-community';
import { Platform } from '../../host/hostContext';
import { buildColumnSlides, sliceInlineRows } from '../gridColumnSlides';

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
// `cellClass` is typed as `string | string[] | CellClassFunc<...>` by AG
// Grid — `.includes` doesn't exist on the function variant, so a plain
// `c.cellClass?.includes(...)` fails to typecheck. None of this test's
// fixtures ever produce a function-typed `cellClass`, so narrowing to the
// array case is enough.
function hasPeekClass(cellClass: ColDef['cellClass']): boolean {
  return Array.isArray(cellClass) && cellClass.includes('mcp-peek-column');
}

describe('sliceInlineRows', () => {
  it('slices to the cap when there are more rows than the cap', () => {
    expect(sliceInlineRows([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it('returns all rows unchanged when there are fewer than the cap', () => {
    expect(sliceInlineRows([1, 2], 6)).toEqual([1, 2]);
  });
});

describe('buildColumnSlides', () => {
  const desktopCols = [
    identityCol('agency'),
    identityCol('dataset'),
    identityCol('country'),
    identityCol('indicator'),
    identityCol('frequency'),
    valueCol('2010'),
    valueCol('2011'),
    chartCol(),
  ];

  it('puts as many columns as fit in slide 0, hides the rest (except the peek), excludes the chart column', () => {
    // 5 identity columns at 220px = 1100px. Adding the 130px '2010' column
    // brings the running total to 1230px, which must still fit within the
    // budget for it to land in slide 0 — hence 1300, not 1100 or 1200.
    const result = buildColumnSlides(
      desktopCols,
      1300,
      0,
      Platform.Desktop,
      false,
    );
    const activeOnly = result.columns.filter(
      (c) => !c.hide && !hasPeekClass(c.cellClass),
    );
    expect(activeOnly.map((c) => c.colId)).toEqual([
      'agency',
      'dataset',
      'country',
      'indicator',
      'frequency',
      '2010',
    ]);
    const chart = result.columns.find((c) => c.colId === 'Chart_column');
    expect(chart?.hide).toBe(true);
  });

  it("marks the next slide's first column as a right peek on desktop, and reports hasPeekRight", () => {
    const result = buildColumnSlides(
      desktopCols,
      1300,
      0,
      Platform.Desktop,
      false,
    );
    const peek = result.columns.find((c) => c.colId === '2011');
    expect(peek?.hide).toBe(false);
    expect(hasPeekClass(peek?.cellClass)).toBe(true);
    expect(result.hasPeekRight).toBe(true);
    expect(result.hasPeekLeft).toBe(false); // slide 0 has no previous slide
  });

  it('shows the truncated adjacent column on mobile too (fills the leftover space), but un-faded and without reporting a peek flag', () => {
    // 3 identity columns at 220px, 500px budget: 'agency'+'dataset' fit
    // (440), 'country' (the true adjacent column) would push to 660 and
    // overflow — it's the one that should show, truncated, not '2011'
    // (which sits several columns further and is never adjacent to slide 0
    // at all, regardless of platform).
    const result = buildColumnSlides(
      desktopCols,
      500,
      0,
      Platform.Mobile,
      false,
    );
    const country = result.columns.find((c) => c.colId === 'country');
    expect(country?.hide).toBe(false);
    expect(hasPeekClass(country?.cellClass)).toBe(false);
    const farColumn = result.columns.find((c) => c.colId === '2011');
    expect(farColumn?.hide).toBe(true);
    expect(result.hasPeekLeft).toBe(false);
    expect(result.hasPeekRight).toBe(false);
  });

  it('reports both peek flags as false when there is only one slide and nothing beyond it', () => {
    const result = buildColumnSlides(
      [valueCol('2010'), valueCol('2011')],
      1200,
      0,
      Platform.Desktop,
      false,
    );
    expect(result.hasPeekLeft).toBe(false);
    expect(result.hasPeekRight).toBe(false);
    expect(result.hasMoreBeyondSlides).toBe(false);
  });

  it('caps at MAX_INLINE_SLIDES and reports hasMoreBeyondSlides when columns overflow it', () => {
    const manyValueCols = Array.from({ length: 30 }, (_, i) =>
      valueCol(`${2000 + i}`),
    );
    const result = buildColumnSlides(
      manyValueCols,
      500,
      0,
      Platform.Desktop,
      false,
    );
    expect(result.slideCount).toBeLessThanOrEqual(3);
    expect(result.hasMoreBeyondSlides).toBe(true);
  });

  it("re-purposes its own last column as the right peek (not an extra column beyond budget), and still left-peeks the previous bucket's last column", () => {
    const manyValueCols = Array.from({ length: 10 }, (_, i) =>
      valueCol(`${2000 + i}`),
    );
    // Force exactly 3 slides of 1 column each (150px budget, 130px columns
    // — a 2nd column would always exceed it), 7 columns left over as
    // overflow. The last slide's own only column ('2002') becomes the right
    // peek instead of adding '2003' (an unbudgeted overflow column) beyond
    // it — the peek + "view more" nudge text stay within the width already
    // computed to fit, nothing renders past that budget.
    const result = buildColumnSlides(
      manyValueCols,
      150,
      2,
      Platform.Desktop,
      false,
    );
    expect(result.hasMoreBeyondSlides).toBe(true);
    expect(result.hasPeekRight).toBe(true);
    expect(result.hasPeekLeft).toBe(true);
    const peeked = result.columns.filter((c) => hasPeekClass(c.cellClass));
    expect(peeked.map((c) => c.colId).sort()).toEqual(['2001', '2002']);
    const overflowCol = result.columns.find((c) => c.colId === '2003');
    expect(overflowCol?.hide).toBe(true);
  });

  it('never un-hides a column that arrived already hidden, regardless of activeSlide', () => {
    const cols = [
      identityCol('agency'),
      permanentlyHiddenCol('other-dim-1'),
      valueCol('2010'),
    ];
    for (const slide of [0, 1, 2]) {
      const result = buildColumnSlides(
        cols,
        2000,
        slide,
        Platform.Desktop,
        false,
      );
      const other = result.columns.find((c) => c.colId === 'other-dim-1');
      expect(other?.hide).toBe(true);
    }
  });

  it('excludes permanently-hidden columns from the slide-width budget', () => {
    const withHidden = [
      valueCol('2010'),
      permanentlyHiddenCol('other-dim-1'),
      valueCol('2011'),
    ];
    // Budget only fits the two real value columns (130px each = 260px); if the
    // hidden column were budgeted too, '2011' would be pushed to slide 1.
    const result = buildColumnSlides(
      withHidden,
      260,
      0,
      Platform.Desktop,
      false,
    );
    const visible = result.columns.filter((c) => !c.hide);
    expect(visible.map((c) => c.colId).sort()).toEqual(['2010', '2011']);
  });

  it('clamps activeSlide into range and reports the effective value when passed out of range', () => {
    const cols = [valueCol('2010'), valueCol('2011')];
    // 130px each, 150px budget → 2 slides total (indices 0 and 1).
    const result = buildColumnSlides(cols, 150, 5, Platform.Desktop, false);
    expect(result.activeSlide).toBe(1);
    // '2010' is also visible here — not because it's "in range", but as the
    // left peek of the now-clamped last slide (slide 1's own range starts
    // at '2011', so '2010' is the column immediately before it).
    const visible = result.columns.filter((c) => !c.hide);
    expect(visible.map((c) => c.colId)).toEqual(['2010', '2011']);
    expect(
      hasPeekClass(visible.find((c) => c.colId === '2010')?.cellClass),
    ).toBe(true);
  });

  it('falls back to a single unpaginated slide when availableWidthPx is not yet measured (0 or negative)', () => {
    const result = buildColumnSlides(
      desktopCols,
      0,
      0,
      Platform.Desktop,
      false,
    );
    expect(result.slideCount).toBe(1);
    expect(result.hasMoreBeyondSlides).toBe(false);
    expect(result.hasPeekLeft).toBe(false);
    expect(result.hasPeekRight).toBe(false);
    const visibleNonChart = result.columns.filter(
      (c) => !c.hide && c.colId !== 'Chart_column',
    );
    expect(visibleNonChart).toHaveLength(7);
  });

  describe("viewportIsMobile — predicting the shared grid component's own width clamp", () => {
    it('clamps desktop-platform column widths to the shared clamp width when the viewport itself is narrow', () => {
      // 5 identity columns at 220px would need 1100px on desktop, but a
      // narrow viewport clamps every column to 100px regardless of
      // `platform` — 5 * 100 = 500px, fitting easily in a 600px budget.
      const cols = [
        identityCol('agency'),
        identityCol('dataset'),
        identityCol('country'),
        identityCol('indicator'),
        identityCol('frequency'),
      ];
      const result = buildColumnSlides(cols, 600, 0, Platform.Desktop, true);
      expect(result.slideCount).toBe(1);
      const visible = result.columns.filter((c) => !c.hide);
      expect(visible).toHaveLength(5);
    });

    it('does not change bucketing when the viewport is not narrow', () => {
      const cols = [
        identityCol('agency'),
        identityCol('dataset'),
        identityCol('country'),
        identityCol('indicator'),
        identityCol('frequency'),
      ];
      // Unclamped, 5 * 220 = 1100px, which does not fit a 600px budget.
      const result = buildColumnSlides(cols, 600, 0, Platform.Desktop, false);
      expect(result.slideCount).toBeGreaterThan(1);
    });
  });

  describe('backfilling an under-full last slide', () => {
    // 8 narrow (130px) value columns, a 520px budget. Every bucket after the
    // first reserves its own left peek's width from the budget (a real,
    // non-hidden column rendered immediately before it), so the forward
    // pass produces UNEVEN buckets: [2000-2003] (520px, no reserve — it's
    // the first bucket), [2004] (130px, budget 520-130=390 reserved for
    // its own left peek, '2003'), [2007] (130px, budget 520-130=390
    // reserved for its own left peek, '2006'). The last bucket, with only
    // one column, backfills '2006' then '2005' from the middle bucket —
    // each pull re-checked against the NEW left peek it would leave behind
    // (390 -> 520 -> would need 650, so it stops there) — landing on
    // [2005, 2006, 2007], still within its 520px budget alongside its own
    // left peek ('2004').
    const cols = Array.from({ length: 8 }, (_, i) => valueCol(`${2000 + i}`));

    it('shows the borrowed columns on both the middle slide and the backfilled last slide', () => {
      const middle = buildColumnSlides(cols, 520, 1, Platform.Desktop, false);
      const middleVisible = middle.columns
        .filter((c) => !c.hide && !hasPeekClass(c.cellClass))
        .map((c) => c.colId);
      expect(middleVisible).toEqual(['2004', '2005', '2006']);

      const last = buildColumnSlides(cols, 520, 2, Platform.Desktop, false);
      const lastVisible = last.columns
        .filter((c) => !c.hide && !hasPeekClass(c.cellClass))
        .map((c) => c.colId);
      expect(lastVisible).toEqual(['2005', '2006', '2007']);
    });

    it("does not change the middle slide's own range despite the last slide borrowing from it, and its own right peek is real (a genuine next slide, not a reclassified trailer)", () => {
      const middle = buildColumnSlides(cols, 520, 1, Platform.Desktop, false);
      const peek = middle.columns.find((c) => c.colId === '2007');
      expect(peek?.hide).toBe(false);
      expect(hasPeekClass(peek?.cellClass)).toBe(true);
      expect(middle.hasPeekRight).toBe(true);
      expect(middle.hasMoreBeyondSlides).toBe(false);
    });

    it("left-peeks the column just before the backfilled last slide's own borrowed start, with no right peek since nothing overflowed", () => {
      const last = buildColumnSlides(cols, 520, 2, Platform.Desktop, false);
      const peek = last.columns.find((c) => c.colId === '2004');
      expect(peek?.hide).toBe(false);
      expect(hasPeekClass(peek?.cellClass)).toBe(true);
      expect(last.hasPeekLeft).toBe(true);
      expect(last.hasPeekRight).toBe(false);
      expect(last.hasMoreBeyondSlides).toBe(false);
    });
  });

  describe('reserving the left peek width when bucketing (not just backfilling)', () => {
    it("keeps a bucket's own natural content within budget once its own left peek is accounted for", () => {
      // 5 identity columns (220px) + 6 value columns (130px), 781px budget —
      // matches a real reported case. Without reserving the left peek's
      // width, the forward pass would let bucket 1 grow to fill the full
      // 781px, then bucket 1's own last column would render as bucket 2's
      // left peek ON TOP of that already-fitted content, overflowing the
      // container with no peek styling on the overflowing part.
      const cols = [
        identityCol('agency'),
        identityCol('dataset'),
        identityCol('country'),
        identityCol('indicator'),
        identityCol('frequency'),
        ...['2021', '2022', '2023', '2024', '2025', '2026'].map(valueCol),
      ];
      const last = buildColumnSlides(cols, 781, 2, Platform.Desktop, false);
      expect(last.hasMoreBeyondSlides).toBe(true);
      const opaque = last.columns
        .filter((c) => !c.hide && !hasPeekClass(c.cellClass))
        .map((c) => c.colId);
      expect(opaque).toEqual(['2021', '2022', '2023']);
      const peeked = last.columns.filter((c) => hasPeekClass(c.cellClass));
      expect(peeked.map((c) => c.colId).sort()).toEqual(['2024', 'frequency']);
      // Left peek (220) + opaque (390) + right peek (130) = 740, within 781.
    });

    it('does NOT reserve for a left overflow column on mobile — it skips showing one entirely, using that width for its own new content instead', () => {
      // Same fixture/width as the desktop case above, only the platform
      // differs. Desktop reserves 220px for 'frequency' as its left peek;
      // mobile doesn't (no fade to justify re-showing something already
      // fully seen on the previous slide), so its own bucket can hold
      // MORE new content instead — here, enough to fit all 6 value
      // columns with no overflow at all, unlike desktop's 3-column split.
      const cols = [
        identityCol('agency'),
        identityCol('dataset'),
        identityCol('country'),
        identityCol('indicator'),
        identityCol('frequency'),
        ...['2021', '2022', '2023', '2024', '2025', '2026'].map(valueCol),
      ];
      const last = buildColumnSlides(cols, 781, 2, Platform.Mobile, false);
      expect(last.hasMoreBeyondSlides).toBe(false);
      const shown = last.columns.filter((c) => !c.hide).map((c) => c.colId);
      expect(shown.sort()).toEqual(
        ['2021', '2022', '2023', '2024', '2025', '2026'].sort(),
      );
      expect(last.columns.some((c) => hasPeekClass(c.cellClass))).toBe(false);
      expect(last.hasPeekLeft).toBe(false);
      expect(last.hasPeekRight).toBe(false);
    });

    it('does not re-show a fully-opaque column across a slide boundary on mobile (no left overflow at all)', () => {
      // 3 identity columns fully fit slide 0 (660px of 781px). Slide 1's
      // own natural range starts right after — its left-overflow index
      // would be 'country' (already fully shown on slide 0), but mobile
      // must never show it, faded or not.
      const cols = [
        identityCol('agency'),
        identityCol('dataset'),
        identityCol('country'),
        identityCol('indicator'),
        identityCol('frequency'),
        ...['2021', '2022'].map(valueCol),
      ];
      const slide0 = buildColumnSlides(cols, 781, 0, Platform.Mobile, false);
      expect(
        slide0.columns.filter((c) => !c.hide).map((c) => c.colId),
      ).toContain('country');

      const slide1 = buildColumnSlides(cols, 781, 1, Platform.Mobile, false);
      const shown1 = slide1.columns.filter((c) => !c.hide).map((c) => c.colId);
      expect(shown1).not.toContain('country');
    });
  });
});
