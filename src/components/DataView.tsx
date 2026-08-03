import { lazy, Suspense, useEffect, useState } from 'react';
import classNames from 'classnames';
import {
  CrossDatasetGridAttachment,
  useConversationViewSidePanelOptional,
} from '@epam/statgpt-conversation-view';
import type { EChartsOption } from 'echarts-for-react/src/types';
import type { Platform } from '../host/hostContext';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';
import { CodePlaceholder } from './CodePlaceholder';
import { ChartView } from './Chart/ChartView';
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
}

const TAB_LABELS: Record<Tab, string> = {
  grid: 'Grid',
  chart: 'Chart',
  code: 'Code',
};

const CROSS_DATASET_GRID_TITLE = 'Cross Dataset Grid';

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
 * @param platform - The desktop/mobile bucket derived from the host context; drives the chart pager's icon sizing.
 * @param isFullscreen - Whether the widget is currently in fullscreen display mode; puts the chart canvas and its dimension list side-by-side instead of stacked.
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
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('grid');
  const closePanel = useConversationViewSidePanelOptional()?.closePanel;

  const availableTabs: Tab[] = [
    ...(crossDatasetGridAttachment ? ['grid' as Tab] : []),
    ...(chartAttachment ? ['chart' as Tab] : []),
    ...(pythonCode ? ['code' as Tab] : []),
  ];

  const effectiveTab: Tab = availableTabs.includes(activeTab)
    ? activeTab
    : availableTabs[0];

  useEffect(() => {
    if (effectiveTab !== 'grid') closePanel?.();
  }, [effectiveTab, closePanel]);

  useEffect(() => {
    document.documentElement.dataset.activeTab = effectiveTab;
    return () => {
      delete document.documentElement.dataset.activeTab;
    };
  }, [effectiveTab]);

  if (!chartAttachment && !crossDatasetGridAttachment && !pythonCode)
    return null;

  const crossDatasetAttachment = crossDatasetGridAttachment
    ? {
        type: ATTACHMENT_TYPE.CROSS_DATASET_GRID,
        title: CROSS_DATASET_GRID_TITLE,
        gridContent: crossDatasetGridAttachment,
      }
    : undefined;

  return (
    <div
      className={classNames('flex flex-col gap-3', {
        'h-full min-h-0': fillHeight,
      })}
    >
      <div className="flex border-b border-neutrals-400">
        {availableTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={classNames(
              'px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary',
              effectiveTab === tab
                ? 'border-semantic-info text-semantic-info'
                : 'border-transparent text-neutrals-700 hover:text-neutrals-1000',
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className={classNames({ 'flex-1 min-h-0': fillHeight })}>
        {effectiveTab === 'grid' && crossDatasetAttachment && (
          <CrossDatasetGridAttachment
            attachment={crossDatasetAttachment}
            fixHeight={!fillHeight}
          />
        )}
        {effectiveTab === 'chart' && chartAttachment && (
          <ChartView
            attachment={chartAttachment}
            transformOption={chartTransformOption}
            platform={platform}
            fillHeight={fillHeight}
            isFullscreen={isFullscreen}
          />
        )}
        {effectiveTab === 'code' && pythonCode && (
          <Suspense fallback={<CodePlaceholder />}>
            <CodeAttachment
              code={pythonCode}
              theme={codeTheme}
              fillHeight={fillHeight}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
