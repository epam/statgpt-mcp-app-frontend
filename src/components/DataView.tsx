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
import { ChevronLeftIcon, ChevronRightIcon } from '../icons/ChevronIcon';
import { CodePlaceholder } from './CodePlaceholder';
import { ChartView } from './Chart/ChartView';
import { GridRowLimitFooter } from './GridRowLimitFooter';
import { GridSlideNav } from './GridSlideNav';
import { HostIconButton } from './HostIconButton';
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
 * horizontally-paged grid (see `buildColumnScrollPlan`/`sliceInlineRows`),
 * navigated by arrow buttons on both platforms, with a `GridRowLimitFooter`
 * whenever rows are truncated. Never a tab switcher, never an unbounded
 * scroll region, matching both platforms' inline-card guidance.
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
 * @param platform - The desktop/mobile bucket derived from the host context; drives grid cell sizing and arrow-icon sizing/hit-slop.
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
   * it never recomputes which columns are hidden. Memoized so it (and the
   * `columns` array it builds) keeps its identity across re-renders that
   * don't change any of its own inputs — otherwise `inlineAttachment` below
   * and the `scrollLeft`-assignment effect would both re-run on every
   * unrelated re-render.
   */
  const scrollPlan = useMemo(
    () =>
      crossDatasetGridAttachment
        ? buildColumnScrollPlan(
            crossDatasetGridAttachment.columns,
            gridWidth,
            viewportIsMobile,
          )
        : undefined,
    [crossDatasetGridAttachment, gridWidth, viewportIsMobile],
  );

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

  const hasPeekLeft = !!scrollPlan && clampedActiveSlide > 0;
  const hasPeekRight =
    !!scrollPlan &&
    (clampedActiveSlide < scrollPlan.pageCount - 1 ||
      scrollPlan.hasMoreBeyondSlides);

  /** Independent of column overflow — gates the plain "more rows" line, not the vertical "more columns" hint. */
  const hasMoreRows = totalRows > rowCap;

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
        <div className="flex items-center justify-between px-4 pb-3">
          <span className="text-sm font-medium text-neutrals-1000">Data</span>
          {scrollPlan && (
            <div className="flex items-center gap-2">
              <HostIconButton
                icon={ChevronLeftIcon}
                platform={platform}
                onClick={() => setActiveSlide((s) => Math.max(0, s - 1))}
                ariaLabel="Previous slide"
                variant="bordered"
                className="relative"
                disabled={clampedActiveSlide === 0}
              />
              <HostIconButton
                icon={ChevronRightIcon}
                platform={platform}
                onClick={() =>
                  setActiveSlide((s) =>
                    Math.min(scrollPlan.pageCount - 1, s + 1),
                  )
                }
                ariaLabel="Next slide"
                variant="bordered"
                className="relative"
                disabled={clampedActiveSlide === scrollPlan.pageCount - 1}
              />
            </div>
          )}
        </div>
        <div className="relative grid">
          <div
            ref={gridWidthRef}
            className={[
              'mcp-grid-carousel',
              'shadow-md',
              '[grid-area:1/1]',
              !hasPeekLeft && 'pl-4',
              !hasPeekRight && 'pr-4',
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
                {...(isMobile
                  ? { metadataColumnWidth: MOBILE_GRID_CELL_HEIGHT }
                  : {})}
              />
            )}
          </div>
          {scrollPlan && (
            <GridSlideNav
              activeSlide={clampedActiveSlide}
              slideCount={scrollPlan.pageCount}
              hasMoreBeyondSlides={scrollPlan.hasMoreBeyondSlides}
              hasMoreRows={hasMoreRows}
            />
          )}
        </div>
        {canRequestFullscreen && (
          <div className="border-t border-neutrals-300">
            <div className="px-4">
              <GridRowLimitFooter
                total={totalRows}
                visible={Math.min(rowCap, totalRows)}
                platform={platform}
                onOpenFullView={requestFullscreen}
              />
            </div>
          </div>
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
