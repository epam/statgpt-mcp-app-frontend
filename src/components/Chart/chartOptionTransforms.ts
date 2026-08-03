import type { EChartsOption } from 'echarts-for-react/src/types';
import type { GridComponentOption, LegendComponentOption } from 'echarts';
import { CHART_SERIES_COLORS } from '../../constants/chartColors';

interface SeriesLike {
  name?: string;
}

export interface LegendItem {
  name: string;
  color: string;
}

/**
 * Reads each named series' resolved color, in series order, for a
 * DOM-rendered legend to use as swatches — colors come from the option's
 * own palette (`option.color`) when set. The chart option is always built
 * with `CHART_SERIES_COLORS` passed in explicitly (see `useDataAttachments`),
 * so this palette is always present in practice; the fallback only guards
 * against an option built without going through that path.
 * @param option - The chart option to read series names/colors from.
 */
export function getLegendItems(option: EChartsOption): LegendItem[] {
  const palette: string[] =
    Array.isArray(option.color) && option.color.length > 0
      ? option.color
      : CHART_SERIES_COLORS;
  const seriesList: SeriesLike[] = Array.isArray(option.series)
    ? option.series
    : option.series
      ? [option.series]
      : [];

  return seriesList
    .map((series, index) => ({ series, index }))
    .filter(
      (
        entry,
      ): entry is { series: SeriesLike & { name: string }; index: number } =>
        typeof entry.series.name === 'string' && entry.series.name.length > 0,
    )
    .map(({ series, index }) => ({
      name: series.name,
      color: palette[index % palette.length],
    }));
}

/**
 * Hides ECharts' own legend rendering while leaving its selection state
 * live, so a DOM-rendered legend (`ChartLegend`) can drive per-series
 * visibility via `legendToggleSelect` / `legendselectchanged` without
 * ECharts painting a second, redundant legend on the canvas.
 * @param option - The chart option to adjust.
 */
export function hideLegend(option: EChartsOption): EChartsOption {
  if (!option.legend) return option;
  const hide = (legend: LegendComponentOption): LegendComponentOption => ({
    ...legend,
    show: false,
  });
  return {
    ...option,
    legend: Array.isArray(option.legend)
      ? option.legend.map(hide)
      : hide(option.legend),
  };
}

/**
 * Zeroes two of the chart option's fixed grid margins so the plot area uses
 * the extra room: the left padding (normally 3%) and the bottom padding
 * (normally ~40px), sized upstream to leave room for ECharts' built-in
 * legend row, which `hideLegend` turns off. `containLabel` still reserves
 * exactly the room the axis labels need on both sides — this only removes
 * the extra padding stacked on top of that reservation. The right padding
 * is left at its 3% default — that side needs the breathing room.
 * @param option - The chart option to adjust, after `hideLegend`.
 */
export function tightenGrid(option: EChartsOption): EChartsOption {
  if (!option.grid) return option;

  const removeMargins = (grid: GridComponentOption): GridComponentOption => ({
    ...grid,
    left: 0,
    bottom: 0,
  });

  return {
    ...option,
    grid: Array.isArray(option.grid)
      ? option.grid.map(removeMargins)
      : removeMargins(option.grid),
  };
}
