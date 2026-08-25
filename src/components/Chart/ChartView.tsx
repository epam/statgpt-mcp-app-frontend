import { useCallback, useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type ReactEChartsRef from 'echarts-for-react';
import type { EChartsOption } from 'echarts-for-react/src/types';
import type { ChartingData, ChartUnit } from '@epam/statgpt-conversation-view';
import classNames from 'classnames';
import { Platform } from '../../host/hostContext';
import { DatasetIcon } from '../../icons/DatasetIcon';
import type { ChartAttachment } from '../../types/attachments';
import {
  getLegendItems,
  hideLegend,
  tightenGrid,
} from './chartOptionTransforms';
import { ChartLegend } from './ChartLegend';
import { ChartPager } from './ChartPager';
import { DimensionsList } from './DimensionsList';

const CHART_CANVAS_MIN_HEIGHT = 300;

interface FlatChartUnit {
  unit: ChartUnit;
  groupTitle?: string;
}

/**
 * Flattens a chart's grouped or ungrouped units into a single indexable
 * list, so the pager can step through "chart X/Y" without caring whether the
 * data came from groups or a flat unit list.
 * @param chartingData - Chart data built by `buildCrossDatasetChartingData`.
 */
function flattenChartingData(
  chartingData: ChartingData | undefined,
): FlatChartUnit[] {
  const groups = chartingData?.groups ?? [];
  const units = chartingData?.units ?? [];
  return groups.length > 0
    ? groups.flatMap((group) =>
        group.units.map((unit) => ({ unit, groupTitle: group.title })),
      )
    : units.map((unit) => ({ unit }));
}

interface Props {
  attachment: ChartAttachment;
  transformOption?: (
    option: EChartsOption,
    ctx: { isMobile: boolean },
  ) => EChartsOption;
  platform: Platform;
  fillHeight?: boolean;
  isFullscreen: boolean;
  className?: string;
}

/**
 * Renders one SDMX chart attachment: an ECharts canvas that never shrinks
 * below a fixed floor regardless of how dimension labels wrap (a flat height
 * in inline mode, a `min-height` that grows to fill available space in
 * fillHeight/pip/fullscreen modes), a DOM-rendered legend below the canvas
 * that wraps freely to as many rows as the series list needs instead of
 * competing with the plot for space or scrolling, a pager for stepping
 * between chart units when there's more than one, and the unit's dimension
 * values as horizontal label/value rows — stacked under the chart normally,
 * or beside it in a fixed 220px column in desktop fullscreen. Mobile always
 * stacks, regardless of display mode, since a fixed-width dimensions column
 * leaves too little room for the chart on a narrow screen.
 * @param attachment - Chart attachment data, built by `useDataAttachments`.
 * @param transformOption - Recolors the chart option per the current host theme, from `useChartTheme`.
 * @param platform - The desktop/mobile bucket derived from the host context; drives the pager's icon sizing and gates the side-by-side fullscreen layout to desktop only.
 * @param fillHeight - When true, stretches to fill the parent's height (pip/fullscreen) and scrolls if content exceeds it; natural height otherwise (inline).
 * @param isFullscreen - Whether the widget is currently in fullscreen display mode; on desktop, puts the chart canvas and its dimension list side-by-side (chart flexible, dimensions a fixed 220px column) instead of stacked. Mobile ignores this and always stacks.
 * @param className - Additional classes for the component's root element.
 */
export function ChartView({
  attachment,
  transformOption,
  platform,
  fillHeight,
  isFullscreen,
  className,
}: Props) {
  const [chartIndex, setChartIndex] = useState(0);
  const [legendSelected, setLegendSelected] = useState<Record<string, boolean>>(
    {},
  );
  const flatUnits = flattenChartingData(attachment.charting_data);
  const chartRef = useRef<ReactEChartsRef>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setChartIndex(0);
  }, [attachment.charting_data]);

  useEffect(() => {
    setLegendSelected({});
  }, [chartIndex]);

  /**
   * `echarts-for-react` measures its inner wrapper's `clientHeight` once at
   * mount and bakes that pixel value into the chart; `resize()` just
   * re-measures the same node rather than reacting to anything on its own.
   * Keeping our own `ResizeObserver` here re-triggers that measurement
   * whenever this container's box actually changes size (e.g. more
   * dimension rows pushing the flex layout in fillHeight mode), which
   * nothing else would otherwise do.
   */
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(() => {
      chartRef.current?.getEchartsInstance().resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const goToPrev = useCallback(() => {
    setChartIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToNext = useCallback(() => {
    setChartIndex((prev) => Math.min(prev + 1, flatUnits.length - 1));
  }, [flatUnits.length]);

  const handleToggleLegend = useCallback((name: string) => {
    chartRef.current
      ?.getEchartsInstance()
      .dispatchAction({ type: 'legendToggleSelect', name });
  }, []);

  const currentFlatUnit = flatUnits[chartIndex] ?? flatUnits[0];
  if (!currentFlatUnit) return null;

  const { unit, groupTitle } = currentFlatUnit;
  const isMobile = platform === Platform.Mobile;
  const isSideBySide = isFullscreen && !isMobile;
  const themedOption = transformOption
    ? transformOption(unit.config, { isMobile })
    : unit.config;
  const legendItems = getLegendItems(themedOption);
  const option = tightenGrid(hideLegend(themedOption));

  /**
   * `echarts-for-react`'s inner wrapper is `height: 100%`, which only
   * resolves against a *definite* parent height — `min-height` alone doesn't
   * count, even though it guarantees a minimum box size. In fillHeight mode
   * the flex column above has a definite height (anchored to `100dvh`), so
   * `min-height` + `flex-1` works there. In inline mode there's deliberately
   * no such ceiling, so this needs a literal `height` instead.
   */
  const canvasStyle = fillHeight
    ? { minHeight: CHART_CANVAS_MIN_HEIGHT }
    : { height: CHART_CANVAS_MIN_HEIGHT };

  return (
    <div
      className={classNames(
        'flex flex-col gap-2',
        fillHeight && 'h-full min-h-0 overflow-y-auto',
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-neutrals-700">
          Chart: {chartIndex + 1}/{flatUnits.length}
        </span>
        <ChartPager
          currentIndex={chartIndex}
          totalCount={flatUnits.length}
          onPrev={goToPrev}
          onNext={goToNext}
          platform={platform}
          showLabel={false}
        />
      </div>
      {groupTitle && (
        <div className="flex items-center gap-1">
          <DatasetIcon
            platform={platform}
            className="size-4 shrink-0 text-neutrals-1000"
          />
          <h4 className="text-neutrals-1000">{groupTitle}</h4>
        </div>
      )}
      <div
        className={classNames(
          'flex min-h-0',
          isSideBySide ? 'flex-row gap-4' : 'flex-col gap-2',
          fillHeight && 'flex-1',
        )}
      >
        <div
          className={classNames(
            'flex min-w-0 flex-col gap-2',
            fillHeight && 'min-h-0 flex-1',
          )}
        >
          <div
            ref={canvasContainerRef}
            className={classNames('min-w-0', fillHeight && 'flex-1')}
            style={canvasStyle}
          >
            <ReactECharts
              ref={chartRef}
              notMerge
              lazyUpdate={false}
              option={option}
              onEvents={{
                legendselectchanged: (params: {
                  selected: Record<string, boolean>;
                }) => setLegendSelected(params.selected),
              }}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
          <ChartLegend
            items={legendItems}
            selected={legendSelected}
            onToggle={handleToggleLegend}
            platform={platform}
          />
        </div>
        <DimensionsList
          dimensions={unit.dimensions}
          className={
            isSideBySide
              ? 'min-h-0 w-[220px] shrink-0 overflow-y-auto'
              : undefined
          }
        />
      </div>
      <ChartPager
        currentIndex={chartIndex}
        totalCount={flatUnits.length}
        onPrev={goToPrev}
        onNext={goToNext}
        platform={platform}
      />
    </div>
  );
}
