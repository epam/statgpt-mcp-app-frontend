import { lazy, Suspense, useEffect, useMemo, type CSSProperties } from 'react';
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
import { Tabs, type TabItem } from './Tabs';
import { GridRowLimitFooter } from './GridRowLimitFooter';
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
const GRID_VISIBLE_ROW_CAP: Record<Platform, number> = {
  [Platform.Desktop]: 6,
  [Platform.Mobile]: 3,
};
const NOOP = () => {};

/**
 * DataView renders a tabbed SDMX data panel with Grid, Chart, and Code tabs,
 * showing only the tabs for which attachment data is provided.
 *
 * The Grid tab is backed by `CrossDatasetGridAttachment`. Each tab is
 * conditionally included based on whether its corresponding attachment prop is
 * defined — if none are provided, the component returns null. When
 * `fillHeight` is set, the component expands to fill available vertical space,
 * enabling correct layout in pip and fullscreen display modes.
 *
 * @example
 * ```tsx
 * <DataView
 *   crossDatasetGridAttachment={{ data, columns }}
 *   chartAttachment={undefined}
 * />
 * ```
 *
 * @param chartAttachment - Chart attachment data for the Chart tab; omit to hide that tab.
 * @param crossDatasetGridAttachment - Grid data for the Grid tab; omit to hide that tab.
 * @param pythonCode - Python source for the Code tab; omit to hide that tab.
 * @param codeTheme - Monaco theme applied to the Code tab, following the host theme.
 * @param fillHeight - When true, the component stretches to fill its container's height for pip or fullscreen modes.
 * @param chartTransformOption - Applied to the chart's ECharts option before render; used to recolor axis/legend text to match the widget's host-driven theme.
 * @param platform - The desktop/mobile bucket derived from the host context; drives the chart pager's icon sizing and gates the chart's side-by-side fullscreen layout to desktop only.
 * @param isFullscreen - Whether the widget is currently in fullscreen display mode; on desktop, puts the chart canvas and its dimension list side-by-side instead of stacked. Mobile always stacks.
 * @param canRequestFullscreen - Whether the host supports switching to fullscreen; gates the Grid tab's mobile-inline "Open full view" footer the same way `FullscreenButton` gates on it.
 * @param requestFullscreen - Called by the Grid tab's mobile-inline footer button to ask the host to switch to fullscreen, once the visible-row cap is hiding some of the dataset.
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
  const gridRowCap = GRID_VISIBLE_ROW_CAP[platform];
  const gridTotalRows = crossDatasetGridAttachment?.data.length ?? 0;
  const gridVisibleRows = Math.min(gridRowCap, gridTotalRows);
  const gridMaxHeightPx = gridCellHeight + gridVisibleRows * gridCellHeight;
  const showGridRowLimitFooter =
    isMobile &&
    !fillHeight &&
    gridTotalRows > gridRowCap &&
    canRequestFullscreen;

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
   */
  const items: TabItem<Tab>[] = useMemo(
    () => [
      ...(crossDatasetAttachment
        ? [
            {
              id: 'grid' as Tab,
              label: 'Grid',
              content: (
                <>
                  <div
                    data-testid="grid-row-cap-wrapper"
                    className={fillHeight ? 'h-full min-h-0' : undefined}
                    style={
                      {
                        '--mcp-grid-max-height': `${gridMaxHeightPx}px`,
                      } as CSSProperties
                    }
                  >
                    <CrossDatasetGridAttachment
                      attachment={crossDatasetAttachment}
                      fixHeight={!fillHeight}
                      rowHeight={gridCellHeight}
                      headerHeight={gridCellHeight}
                      {...(isMobile
                        ? { metadataColumnWidth: MOBILE_GRID_CELL_HEIGHT }
                        : {})}
                    />
                  </div>
                  {showGridRowLimitFooter && (
                    <GridRowLimitFooter
                      total={gridTotalRows}
                      visible={gridRowCap}
                      platform={platform}
                      onOpenFullView={requestFullscreen}
                    />
                  )}
                </>
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
      fillHeight,
      isMobile,
      gridCellHeight,
      gridMaxHeightPx,
      showGridRowLimitFooter,
      gridTotalRows,
      gridRowCap,
      requestFullscreen,
      chartAttachment,
      chartTransformOption,
      platform,
      isFullscreen,
      pythonCode,
      codeTheme,
    ],
  );

  const [activeTab, setActiveTab] = useActiveTab(items);

  useEffect(() => {
    if (activeTab !== 'grid') closePanel?.();
  }, [activeTab, closePanel]);

  useEffect(() => {
    document.documentElement.dataset.activeTab = activeTab;
    return () => {
      delete document.documentElement.dataset.activeTab;
    };
  }, [activeTab]);

  if (!chartAttachment && !crossDatasetGridAttachment && !pythonCode)
    return null;

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
