import { lazy, Suspense, useEffect, useMemo } from 'react';
import {
  CrossDatasetGridAttachment,
  useConversationViewSidePanelOptional,
} from '@epam/statgpt-conversation-view';
import type { EChartsOption } from 'echarts-for-react/src/types';
import { Platform } from '../host/hostContext';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';
import { useActiveTab } from '../hooks/useActiveTab';
import { CodePlaceholder } from './CodePlaceholder';
import { ChartView } from './Chart/ChartView';
import { InlineDataHeader } from './InlineDataHeader';
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

const INLINE_CHART_TEXT =
  'You\'re looking at a chart summary of the result. The generated data table is available in the chat response. You can see a more detailed table in the advanced view by going into "Explore the data".';
const INLINE_NO_CHART_TEXT =
  "This result doesn't have a chart to show. The full data table and the code that produced it are available in the detailed view.";

/**
 * DataView renders the widget's SDMX data content.
 *
 * In inline display mode (`fillHeight` false) it shows a single view — the
 * chart alone when chart data is available, or a short explanatory message
 * otherwise — never a tab switcher or a grid, matching both host platforms'
 * inline-card guidance against nested scrolling and multiple views.
 *
 * In pip/fullscreen (`fillHeight` true) it renders the Grid/Chart/Code tab
 * switcher, showing only the tabs for which attachment data is provided —
 * tabs are unrestricted once the widget leaves inline mode. `PREFERRED_FULLSCREEN_TAB`
 * decides which tab starts selected (falling back to the first available
 * one when it's absent), independently of the tab bar's own left-to-right
 * order.
 *
 * @param chartAttachment - Chart attachment data; omit to hide the Chart tab/inline chart.
 * @param crossDatasetGridAttachment - Grid data for the Grid tab (pip/fullscreen only).
 * @param pythonCode - Python source for the Code tab (pip/fullscreen only).
 * @param codeTheme - Monaco theme applied to the Code tab, following the host theme.
 * @param fillHeight - When true, renders the pip/fullscreen tabbed layout and stretches to fill the container's height; when false (inline), renders the chart-only view.
 * @param chartTransformOption - Applied to the chart's ECharts option before render; used to recolor axis/legend text to match the widget's host-driven theme.
 * @param platform - The desktop/mobile bucket derived from the host context; drives the chart pager's icon sizing, the fullscreen chart layout, and the inline header button's tap target.
 * @param isFullscreen - Whether the widget is currently in fullscreen display mode; on desktop, puts the chart canvas and its dimension list side-by-side instead of stacked. Mobile always stacks.
 * @param canRequestFullscreen - Whether the host supports switching to fullscreen; gates the inline header's "Explore the data" button.
 * @param requestFullscreen - Called by the inline header's button to ask the host to switch to fullscreen.
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

  const hasAnyData =
    !!chartAttachment || !!crossDatasetGridAttachment || !!pythonCode;

  /**
   * Inline mode's own active-content marker, kept separate from the
   * pip/fullscreen tab switcher's `activeTab` state above. `global.scss`
   * unsets `#root`'s min-height floor when this is `'no-chart'`, mirroring
   * the shrink-to-content treatment inline mode used to apply when its
   * (now-removed) Grid tab was active by default.
   */
  useEffect(() => {
    if (fillHeight || !hasAnyData) return;
    document.documentElement.dataset.activeTab = chartAttachment
      ? 'chart'
      : 'no-chart';
    return () => {
      delete document.documentElement.dataset.activeTab;
    };
  }, [fillHeight, hasAnyData, chartAttachment]);

  if (!hasAnyData) return null;

  if (!fillHeight) {
    return (
      <div>
        {canRequestFullscreen && (
          <InlineDataHeader
            text={chartAttachment ? INLINE_CHART_TEXT : INLINE_NO_CHART_TEXT}
            platform={platform}
            onExploreData={requestFullscreen}
          />
        )}
        {chartAttachment && (
          <ChartView
            attachment={chartAttachment}
            transformOption={chartTransformOption}
            platform={platform}
            fillHeight={false}
            isFullscreen={false}
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
