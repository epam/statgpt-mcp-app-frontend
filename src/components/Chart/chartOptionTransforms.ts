import type { EChartsOption } from 'echarts-for-react/src/types';
import type { GridComponentOption, LegendComponentOption } from 'echarts';

/**
 * Left-aligns the chart's legend instead of ECharts' default horizontal
 * centering, to match the design. Series colors/labels are otherwise
 * untouched — only the `left` positioning key changes.
 * @param option - The chart option to adjust, after any host-theme transform.
 */
export function alignLegendLeft(option: EChartsOption): EChartsOption {
  if (!option.legend) return option;
  return {
    ...option,
    legend: Array.isArray(option.legend)
      ? option.legend.map((legend: LegendComponentOption) => ({
          ...legend,
          left: 'left',
        }))
      : { ...option.legend, left: 'left' },
  };
}

/**
 * Zeroes the chart option's fixed left grid padding (normally 3%), so the
 * plot area uses more of the available width on that side. `containLabel`
 * still reserves exactly the room the y-axis labels need — this only
 * removes the extra 3% padding stacked on top of that reservation. The
 * right padding is left at its 3% default — that side needs the breathing
 * room.
 * @param option - The chart option to adjust.
 */
export function tightenGrid(option: EChartsOption): EChartsOption {
  if (!option.grid) return option;

  const removeLeftMargin = (
    grid: GridComponentOption,
  ): GridComponentOption => ({
    ...grid,
    left: 0,
  });

  return {
    ...option,
    grid: Array.isArray(option.grid)
      ? option.grid.map(removeLeftMargin)
      : removeLeftMargin(option.grid),
  };
}
