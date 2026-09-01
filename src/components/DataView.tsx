import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  CrossDatasetGridAttachment,
  useConversationViewSidePanelOptional,
} from '@epam/statgpt-conversation-view';
import { MOBILE_BREAKPOINT, useIsMobile } from '@epam/statgpt-ui-components';
import type { EChartsOption } from 'echarts-for-react/src/types';
import { Platform } from '../host/hostContext';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';
import { INLINE_GRID_ROW_CAP } from '../constants/inlineGrid';
import {
  buildColumnScrollPlan,
  sliceInlineRows,
} from '../adapters/gridColumnSlides';
import { useActiveTab } from '../hooks/useActiveTab';
import { useElementWidth } from '../hooks/useElementWidth';
import { useSwipeNavigation } from '../hooks/useSwipeNavigation';
import { CodePlaceholder } from './CodePlaceholder';
import { ChartView } from './Chart/ChartView';
import { GridRowLimitFooter } from './GridRowLimitFooter';
import { GridSlideNav } from './GridSlideNav';
import { MobileGridNudge, MOBILE_GRID_NUDGE_TEXT } from './MobileGridNudge';
import { Tabs, type TabItem } from './Tabs';
import type {
  ChartAttachment,
  CrossDatasetGridAttachmentData,
} from '../types/attachments';

/**
 * Lazy so Monaco's editor bundle (see `CodeAttachment`/`setupMonaco`) is only
 * fetched the first time the Code tab is actually opened, instead of at app boot.
 */
const CodeAttachment = lazy(() =>
  import('./CodeAttachment').then((m) => ({ default: m.CodeAttachment })),
);

type Tab = 'grid' | 'chart' | 'code';

interface Props {
  chartAttachment: ChartAttachment | undefined;
  crossDatasetGridAttachment: CrossDatasetGridAttachmentData | undefined;
  pythonCode?: string;
  codeTheme?: 'light' | 'dark';
  fillHeight?: boolean;
  chartTransformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption;
  platform: Platform;
  isFullscreen: boolean;
  canRequestFullscreen?: boolean;
  requestFullscreen?: () => void;
}

const CROSS_DATASET_GRID_TITLE = 'Cross Dataset Grid';
const MOBILE_GRID_CELL_HEIGHT = 44;
const DESKTOP_GRID_CELL_HEIGHT = 32;
const NOOP = () => {};

/**
 * Tab selected by default in pip/fullscreen when available, falling back to
 * the first item in `items` otherwise (see `useActiveTab`). A single named
 * constant so the default can be revisited later without reordering the
 * visible tab bar, which is controlled separately by `items`' own order.
 */
const PREFERRED_FULLSCREEN_TAB: Tab = 'grid';

/**
 * DataView renders the widget's SDMX data content.
 *
 * In inline display mode (`fillHeight` false) it renders a row-capped,
 * horizontally-paged grid (see `buildColumnScrollPlan`/`sliceInlineRows`) —
 * arrow-button navigation on desktop, swipe gesture on mobile — with a
 * `GridRowLimitFooter` whenever rows are truncated. Never a tab switcher,
 * never an unbounded scroll region, matching both platforms' inline-card
 * guidance.
 *
 * In pip/fullscreen (`fillHeight` true) it renders the unchanged Grid/Chart/Code
 * tab switcher with the full, unsliced dataset.
 *
 * @param chartAttachment - Chart attachment data; omit to hide the Chart tab (pip/fullscreen only).
 * @param crossDatasetGridAttachment - Grid data for the inline carousel and the Grid tab (pip/fullscreen).
 * @param pythonCode - Python source for the Code tab (pip/fullscreen only).
 * @param codeTheme - Monaco theme applied to the Code tab, following the host theme.
 * @param fillHeight - When true, renders the pip/fullscreen tabbed layout and stretches to fill the container's height; when false (inline), renders the row/column-capped grid carousel.
 * @param chartTransformOption - Applied to the chart's ECharts option before render; used to recolor axis/legend text to match the widget's host-driven theme.
 * @param platform - The desktop/mobile bucket derived from the host context; drives grid cell sizing, column widths, and whether swipe or arrow-button navigation is used.
 * @param isFullscreen - Whether the widget is currently in fullscreen display mode; on desktop, puts the chart canvas and its dimension list side-by-side instead of stacked. Mobile always stacks.
 * @param canRequestFullscreen - Whether the host supports switching to fullscreen; gates the inline row-limit footer's "open full view" action.
 * @param requestFullscreen - Called by the inline row-limit footer to ask the host to switch to fullscreen.
 */
export function DataView({
  chartAttachment,
  crossDatasetGridAttachment,
  pythonCode,
  codeTheme,
  fillHeight,
  chartTransformOption,
  platform,
  isFullscreen,
  canRequestFullscreen = false,
  requestFullscreen = NOOP,
}: Props) {
  const closePanel = useConversationViewSidePanelOptional()?.closePanel;
  const isMobile = platform === Platform.Mobile;
  const gridCellHeight = isMobile
    ? MOBILE_GRID_CELL_HEIGHT
    : DESKTOP_GRID_CELL_HEIGHT;

  const crossDatasetAttachment = useMemo(
    () =>
      crossDatasetGridAttachment
        ? {
            type: ATTACHMENT_TYPE.CROSS_DATASET_GRID,
            title: CROSS_DATASET_GRID_TITLE,
            gridContent: crossDatasetGridAttachment,
          }
        : undefined,
    [crossDatasetGridAttachment],
  );

  /**
   * Memoized so the active tab's content element keeps the same identity
   * across re-renders that don't actually change any of these dependencies
   * (e.g. a parent re-render triggered by unrelated state). `useMemo` skips
   * re-running this callback in that case, so `Tabs` receives the exact
   * same React element it did before — React then bails out of
   * re-rendering `CrossDatasetGridAttachment`/`ChartView`/`CodeAttachment`
   * for that tab entirely, without needing `React.memo` on any of them.
   *
   * Only used for the pip/fullscreen tab switcher — inline mode never
   * renders `Tabs`, so building this when `fillHeight` is false is wasted
   * work, but harmless (it's gated by attachment presence either way).
   */
  const items: TabItem<Tab>[] = useMemo(
    () => [
      ...(crossDatasetAttachment
        ? [
            {
              id: 'grid' as Tab,
              label: 'Grid',
              content: (
                <CrossDatasetGridAttachment
                  attachment={crossDatasetAttachment}
                  fixHeight={false}
                  rowHeight={gridCellHeight}
                  headerHeight={gridCellHeight}
                  {...(isMobile
                    ? { metadataColumnWidth: MOBILE_GRID_CELL_HEIGHT }
                    : {})}
                />
              ),
            },
          ]
        : []),
      ...(chartAttachment
        ? [
            {
              id: 'chart' as Tab,
              label: 'Chart',
              content: (
                <ChartView
                  attachment={chartAttachment}
                  transformOption={chartTransformOption}
                  platform={platform}
                  fillHeight={fillHeight}
                  isFullscreen={isFullscreen}
                />
              ),
            },
          ]
        : []),
      ...(pythonCode
        ? [
            {
              id: 'code' as Tab,
              label: 'Code',
              content: (
                <Suspense fallback={<CodePlaceholder />}>
                  <CodeAttachment
                    code={pythonCode}
                    theme={codeTheme}
                    fillHeight={fillHeight}
                  />
                </Suspense>
              ),
            },
          ]
        : []),
    ],
    [
      crossDatasetAttachment,
      isMobile,
      gridCellHeight,
      chartAttachment,
      chartTransformOption,
      platform,
      fillHeight,
      isFullscreen,
      pythonCode,
      codeTheme,
    ],
  );

  const [activeTab, setActiveTab] = useActiveTab(
    items,
    PREFERRED_FULLSCREEN_TAB,
  );

  useEffect(() => {
    if (activeTab !== 'grid') closePanel?.();
  }, [activeTab, closePanel]);

  useEffect(() => {
    if (!fillHeight) return;
    document.documentElement.dataset.activeTab = activeTab;
    return () => {
      delete document.documentElement.dataset.activeTab;
    };
  }, [fillHeight, activeTab]);

  // Inline-only state: which column page is active, reset whenever a new
  // result arrives (a new `crossDatasetGridAttachment` reference).
  const [activeSlide, setActiveSlide] = useState(0);
  useEffect(() => {
    setActiveSlide(0);
  }, [crossDatasetGridAttachment]);

  const [gridWidthRef, gridWidth, gridNodeRef] =
    useElementWidth<HTMLDivElement>();
  /**
   * `CrossDatasetGridAttachment` decides its own mobile column-width clamp
   * from `window.innerWidth` alone, independent of `platform` — this widget
   * relies on `platform` for everything else (row cap, arrows, gesture),
   * but page layout needs to predict that clamp too, or it budgets pages
   * against a column width that won't actually render whenever the host
   * says desktop but the real viewport is this narrow.
   */
  const viewportIsMobile = useIsMobile(MOBILE_BREAKPOINT);

  const rowCap = INLINE_GRID_ROW_CAP[platform];
  const totalRows = crossDatasetGridAttachment?.data.length ?? 0;
  const inlineRows = useMemo(
    () =>
      crossDatasetGridAttachment
        ? sliceInlineRows(crossDatasetGridAttachment.data, rowCap)
        : [],
    [crossDatasetGridAttachment, rowCap],
  );

  /**
   * Unlike the old bucketing approach, this doesn't depend on `activeSlide`
   * at all — every reachable column is always rendered, at its natural
   * width; navigation only ever moves `scrollLeft` (see the effect below),
   * it never recomputes which columns are hidden.
   */
  const scrollPlan = crossDatasetGridAttachment
    ? buildColumnScrollPlan(
        crossDatasetGridAttachment.columns,
        gridWidth,
        platform,
        viewportIsMobile,
      )
    : undefined;

  const clampedActiveSlide = scrollPlan
    ? Math.min(Math.max(activeSlide, 0), scrollPlan.pageCount - 1)
    : activeSlide;

  /**
   * Same "sync a drifted value back into state" pattern the old bucketing
   * approach used internally — e.g. a resize that shrinks `pageCount` below
   * the current `activeSlide` needs correcting so a later prev/next click
   * (reading `activeSlide` via `setActiveSlide`'s functional updater) starts
   * from the corrected value instead of the stale, out-of-range one.
   */
  useEffect(() => {
    if (clampedActiveSlide !== activeSlide) {
      setActiveSlide(clampedActiveSlide);
    }
    // Intentionally keyed on clampedActiveSlide alone: adding activeSlide
    // would only ever re-run this effect right after it just set that same
    // value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedActiveSlide]);

  /**
   * The actual navigation mechanism: set the grid's real `scrollLeft` to
   * the target page's offset. `.ag-center-cols-viewport` has `overflow-x:
   * hidden` (see `grid.scss`) — that only disables the native scrollbar
   * and wheel/touch-drag scrolling (this widget's own "no free scroll"
   * requirement); a programmatic `scrollLeft` assignment still works and
   * still fires the `scroll` event AG Grid's own virtualization listens to.
   */
  useEffect(() => {
    if (!scrollPlan) return;
    const scrollEl = gridNodeRef.current?.querySelector<HTMLElement>(
      '.ag-center-cols-viewport',
    );
    if (!scrollEl) return;
    scrollEl.scrollLeft = scrollPlan.pageOffsets[clampedActiveSlide] ?? 0;
  }, [scrollPlan, clampedActiveSlide, gridNodeRef]);

  const inlineAttachment = useMemo(
    () =>
      crossDatasetGridAttachment && scrollPlan
        ? {
            type: ATTACHMENT_TYPE.CROSS_DATASET_GRID,
            title: CROSS_DATASET_GRID_TITLE,
            gridContent: { data: inlineRows, columns: scrollPlan.columns },
          }
        : undefined,
    [crossDatasetGridAttachment, scrollPlan, inlineRows],
  );

  // Desktop only — mobile shows no edge shadow at all, same as before this
  // rewrite (there's no per-column fade in this model either way, but the
  // container-level mask must stay off on mobile regardless).
  const hasPeekLeft = !isMobile && !!scrollPlan && clampedActiveSlide > 0;
  const hasPeekRight =
    !isMobile &&
    !!scrollPlan &&
    (clampedActiveSlide < scrollPlan.pageCount - 1 ||
      scrollPlan.hasMoreBeyondSlides);

  /** Independent of column overflow — gates the plain "more rows" line, not the vertical "more columns" hint. */
  const hasMoreRows = totalRows > rowCap;

  /**
   * Mobile's version of `GridSlideNav`'s own internal "show the rows line"
   * check (same condition: on the true last page, when there are more rows
   * than the cap displays) — duplicated here (not shared) only because the
   * duplicate plain-text line has to render OUTSIDE the flex row
   * `MobileGridNudge`'s column sits in, as a sibling below it, not returned
   * alongside the column from that component itself. Independent of
   * `scrollPlan.hasMoreBeyondSlides`, which only gates the vertical column
   * hint (rendered by `MobileGridNudge`) — a dataset can have more columns,
   * more rows, both, or neither.
   */
  const showMobileNudge =
    isMobile &&
    !!scrollPlan &&
    clampedActiveSlide === scrollPlan.pageCount - 1 &&
    hasMoreRows;

  const swipeHandlers = useSwipeNavigation(
    () => setActiveSlide((s) => Math.max(0, s - 1)),
    () =>
      setActiveSlide((s) =>
        scrollPlan ? Math.min(scrollPlan.pageCount - 1, s + 1) : s,
      ),
  );

  useEffect(() => {
    if (fillHeight) return;
    document.documentElement.dataset.activeTab = inlineAttachment
      ? 'grid'
      : 'no-grid';
    return () => {
      delete document.documentElement.dataset.activeTab;
    };
  }, [fillHeight, inlineAttachment]);

  const hasAnyData =
    !!chartAttachment || !!crossDatasetGridAttachment || !!pythonCode;

  if (!hasAnyData) return null;

  if (!fillHeight) {
    return (
      <div>
        {isMobile ? (
          // Mobile: the grid div and the nudge column are plain, separate
          // flex siblings — nothing overlays anything else, so no
          // `[grid-area:1/1]`/invisible-clone height trick is needed here;
          // flex already sizes the row to the taller of the two on its own.
          <div className="flex">
            <div
              ref={gridWidthRef}
              className="mcp-grid-carousel min-w-0 flex-1"
              onPointerDown={swipeHandlers.onPointerDown}
              onPointerMove={swipeHandlers.onPointerMove}
              onPointerUp={swipeHandlers.onPointerUp}
              style={{ touchAction: 'pan-y' }}
            >
              {inlineAttachment && (
                <CrossDatasetGridAttachment
                  attachment={inlineAttachment}
                  fixHeight={false}
                  rowHeight={gridCellHeight}
                  headerHeight={gridCellHeight}
                  metadataColumnWidth={MOBILE_GRID_CELL_HEIGHT}
                />
              )}
            </div>
            {scrollPlan && (
              <MobileGridNudge
                activeSlide={clampedActiveSlide}
                slideCount={scrollPlan.pageCount}
                hasMoreBeyondSlides={scrollPlan.hasMoreBeyondSlides}
              />
            )}
          </div>
        ) : (
          // Desktop: `grid` + `[grid-area:1/1]` on both this row's children
          // makes them share one cell, so the row's height is the taller of
          // the two — the masked grid div (its own fixed row-count height)
          // and GridSlideNav's wrapper (whose invisible sizing clone, when
          // the "view more" nudge shows, reports the nudge text's full
          // un-clamped height). A plain `relative` wrapper couldn't do this:
          // an absolutely-positioned child never contributes to its
          // ancestor's height, so a short (e.g. two-row) grid would let the
          // nudge text overflow past the row instead of the row growing to
          // fit it. This overlay approach only makes sense on desktop
          // because it relies on the edge-mask shadow to soften the overlap
          // — mobile (above) has no shadow, so its nudge sits beside the
          // grid instead of over it.
          <div className="relative grid">
            <div
              ref={gridWidthRef}
              className={[
                'mcp-grid-carousel',
                '[grid-area:1/1]',
                hasPeekRight && 'mcp-grid-carousel--has-next',
                hasPeekLeft && 'mcp-grid-carousel--has-prev',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {inlineAttachment && (
                <CrossDatasetGridAttachment
                  attachment={inlineAttachment}
                  fixHeight={false}
                  rowHeight={gridCellHeight}
                  headerHeight={gridCellHeight}
                />
              )}
            </div>
            {scrollPlan && (
              <GridSlideNav
                activeSlide={clampedActiveSlide}
                slideCount={scrollPlan.pageCount}
                hasMoreBeyondSlides={scrollPlan.hasMoreBeyondSlides}
                hasMoreRows={hasMoreRows}
                showArrows
                platform={platform}
                onPrev={() => setActiveSlide((s) => Math.max(0, s - 1))}
                onNext={() =>
                  setActiveSlide((s) =>
                    Math.min(scrollPlan.pageCount - 1, s + 1),
                  )
                }
              />
            )}
          </div>
        )}
        {showMobileNudge && (
          <p className="mt-2 text-center text-xs text-neutrals-700">
            {MOBILE_GRID_NUDGE_TEXT}
          </p>
        )}
        {canRequestFullscreen && (
          <GridRowLimitFooter
            total={totalRows}
            visible={Math.min(rowCap, totalRows)}
            platform={platform}
            onOpenFullView={requestFullscreen}
          />
        )}
      </div>
    );
  }

  return (
    <Tabs
      items={items}
      activeId={activeTab}
      onSelect={setActiveTab}
      fillHeight={fillHeight}
      platform={platform}
    />
  );
}
