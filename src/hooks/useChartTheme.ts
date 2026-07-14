import { useMemo } from 'react';
import type { EChartsOption } from 'echarts-for-react/src/types';
import type {
  McpUiHostContext,
  McpUiStyles,
  McpUiTheme,
} from '@modelcontextprotocol/ext-apps';

type TransformOption = (
  option: EChartsOption,
  ctx: { isMobile: boolean },
) => EChartsOption;

interface ChartColors {
  axisLabel?: string;
  axisLine?: string;
  splitLine?: string;
  legendText?: string;
}

const GRID_TOP = 12;

const LIGHT_DARK_FN_RE = /^light-dark\((.*)\)$/i;

/**
 * Splits a CSS argument list on top-level commas only, ignoring commas
 * nested inside a function call (e.g. the two `rgba(...)` arguments of
 * `light-dark(rgba(...), rgba(...))`).
 */
function splitTopLevelArgs(input: string): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of input) {
    if (char === '(') depth += 1;
    if (char === ')') depth -= 1;

    if (char === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) args.push(current.trim());
  return args;
}

/**
 * Resolves a host token value that may be a CSS `light-dark(lightColor,
 * darkColor)` function string. The browser only evaluates `light-dark()`
 * when a value is assigned to a real CSS property with a `color-scheme` in
 * scope — ECharts renders to canvas and receives the raw string as-is, so it
 * can't parse it as a color at all. Since we already know `theme`, we pick
 * the correct branch ourselves instead of relying on CSS evaluation.
 */
function resolveLightDark(
  value: string,
  theme: McpUiTheme | undefined,
): string {
  const match = value.match(LIGHT_DARK_FN_RE);
  if (!match) return value;

  const [lightValue, darkValue] = splitTopLevelArgs(match[1]);
  const resolved = theme === 'dark' ? darkValue : lightValue;
  return resolved ?? value;
}

function colorsFromHostVariables(
  variables: McpUiStyles | undefined,
  theme: McpUiTheme | undefined,
): ChartColors {
  const readToken = (key: keyof McpUiStyles) => {
    const raw = variables?.[key];
    return raw ? resolveLightDark(raw, theme) : undefined;
  };

  return {
    axisLabel: readToken('--color-text-tertiary'),
    axisLine: readToken('--color-border-secondary'),
    splitLine: readToken('--color-border-tertiary'),
    legendText: readToken('--color-text-secondary'),
  };
}

function buildTransformOption(colors: ChartColors): TransformOption {
  return (option) => {
    const legend = Array.isArray(option.legend)
      ? option.legend[0]
      : option.legend;
    const xAxis = Array.isArray(option.xAxis) ? option.xAxis[0] : option.xAxis;
    const yAxis = Array.isArray(option.yAxis) ? option.yAxis[0] : option.yAxis;

    return {
      ...option,
      grid: { ...option.grid, top: GRID_TOP },
      legend: legend
        ? {
            ...legend,
            textStyle: {
              ...legend.textStyle,
              ...(colors.legendText ? { color: colors.legendText } : {}),
            },
          }
        : legend,
      xAxis: xAxis
        ? {
            ...xAxis,
            axisLabel: {
              ...xAxis.axisLabel,
              ...(colors.axisLabel ? { color: colors.axisLabel } : {}),
            },
            axisLine: colors.axisLine
              ? {
                  ...xAxis.axisLine,
                  lineStyle: {
                    ...xAxis.axisLine?.lineStyle,
                    color: colors.axisLine,
                  },
                }
              : xAxis.axisLine,
            splitLine: colors.splitLine
              ? {
                  ...xAxis.splitLine,
                  lineStyle: {
                    ...xAxis.splitLine?.lineStyle,
                    color: colors.splitLine,
                  },
                }
              : xAxis.splitLine,
          }
        : xAxis,
      yAxis: yAxis
        ? {
            ...yAxis,
            axisLabel: {
              ...yAxis.axisLabel,
              ...(colors.axisLabel ? { color: colors.axisLabel } : {}),
            },
            axisLine: colors.axisLine
              ? {
                  ...yAxis.axisLine,
                  lineStyle: {
                    ...yAxis.axisLine?.lineStyle,
                    color: colors.axisLine,
                  },
                }
              : yAxis.axisLine,
            splitLine: colors.splitLine
              ? {
                  ...yAxis.splitLine,
                  lineStyle: {
                    ...yAxis.splitLine?.lineStyle,
                    color: colors.splitLine,
                  },
                }
              : yAxis.splitLine,
          }
        : yAxis,
    };
  };
}

/**
 * Builds a chart `transformOption` that recolors axis/legend text to match
 * the widget's current host theme. Series colors are left untouched — they
 * come from the chart library's own default palette.
 *
 * Reads color values directly off `hostContext.styles.variables` (the token
 * strings delivered in the handshake payload) rather than resolving CSS
 * custom properties through the DOM. A host may deliver a plain color or a
 * `light-dark(...)` function string (see `resolveLightDark`). Any token the
 * host doesn't send is left alone — the chart keeps whatever color the
 * library's own default option already set for it, rather than substituting
 * a guessed value that can't be correct for every host and theme.
 */
export function useChartTheme(
  hostContext: McpUiHostContext | undefined,
): TransformOption {
  const theme = hostContext?.theme;
  const variables = hostContext?.styles?.variables;

  return useMemo(
    () => buildTransformOption(colorsFromHostVariables(variables, theme)),
    [variables, theme],
  );
}
