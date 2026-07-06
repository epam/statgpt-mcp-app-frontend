import { useState } from 'react';
import classNames from 'classnames';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import {
  ChartingIcon,
  CustomChartAttachment,
  CrossDatasetGridAttachment,
} from '@epam/statgpt-conversation-view';
import { ATTACHMENT_TYPE } from '../constants/attachmentTypes';
import { CodeAttachment } from './CodeAttachment';
import type {
  ChartAttachment,
  CrossDatasetGridAttachmentData,
} from '../types/attachments';

const CHART_NAVIGATION_ICONS = {
  [ChartingIcon.PREVIOUS]: <IconChevronLeft width={20} height={20} />,
  [ChartingIcon.NEXT]: <IconChevronRight width={20} height={20} />,
};

type Tab = 'grid' | 'chart' | 'code';

interface Props {
  chartAttachment: ChartAttachment | undefined;
  crossDatasetGridAttachment: CrossDatasetGridAttachmentData | undefined;
  pythonCode?: string;
  codeTheme?: 'light' | 'dark';
  fillHeight?: boolean;
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
 */
export function DataView({
  chartAttachment,
  crossDatasetGridAttachment,
  pythonCode,
  codeTheme,
  fillHeight,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('grid');

  if (!chartAttachment && !crossDatasetGridAttachment && !pythonCode)
    return null;

  const availableTabs: Tab[] = [
    ...(crossDatasetGridAttachment ? ['grid' as Tab] : []),
    ...(chartAttachment ? ['chart' as Tab] : []),
    ...(pythonCode ? ['code' as Tab] : []),
  ];

  const effectiveTab: Tab = availableTabs.includes(activeTab)
    ? activeTab
    : availableTabs[0];

  const crossDatasetAttachment = crossDatasetGridAttachment
    ? {
        type: ATTACHMENT_TYPE.CROSS_DATASET_GRID,
        title: CROSS_DATASET_GRID_TITLE,
        gridContent: crossDatasetGridAttachment,
      }
    : undefined;

  return (
    <div
      className={classNames('flex flex-col gap-4', {
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
          <CustomChartAttachment
            attachment={chartAttachment}
            fillHeight={fillHeight}
            fixHeight={!fillHeight}
            icons={CHART_NAVIGATION_ICONS}
          />
        )}
        {effectiveTab === 'code' && pythonCode && (
          <CodeAttachment
            code={pythonCode}
            theme={codeTheme}
            fillHeight={fillHeight}
          />
        )}
      </div>
    </div>
  );
}
