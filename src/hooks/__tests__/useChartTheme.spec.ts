import { renderHook } from '@testing-library/react';
import type {
  McpUiHostContext,
  McpUiStyles,
} from '@modelcontextprotocol/ext-apps';
import { useChartTheme } from '../useChartTheme';

function makeHostContext(
  overrides: Partial<McpUiHostContext> = {},
): McpUiHostContext {
  return overrides as McpUiHostContext;
}

function makeVariables(overrides: Partial<McpUiStyles>): McpUiStyles {
  return overrides as McpUiStyles;
}

const CHART_OPTION_SHAPE = {
  legend: { textStyle: {} },
  xAxis: { axisLabel: {}, axisLine: { lineStyle: {} }, splitLine: {} },
  yAxis: { axisLabel: {}, axisLine: {}, splitLine: { lineStyle: {} } },
};

describe('useChartTheme', () => {
  it('returns a transformOption function', () => {
    const { result } = renderHook(() => useChartTheme(undefined));

    expect(typeof result.current).toBe('function');
  });

  describe('no host style variables', () => {
    it('leaves axis/legend colors untouched when the host sends no tokens', () => {
      const { result } = renderHook(() =>
        useChartTheme(makeHostContext({ theme: 'light' })),
      );

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });

      expect(option.legend.textStyle).toEqual({});
      expect(option.xAxis.axisLabel).toEqual({});
      expect(option.xAxis.axisLine).toEqual({ lineStyle: {} });
      expect(option.yAxis.splitLine).toEqual({ lineStyle: {} });
    });

    it('leaves series colors untouched (no `color` key set on the option)', () => {
      const { result } = renderHook(() => useChartTheme(undefined));

      const option = result.current(
        { color: ['#abc123'] },
        {
          isMobile: false,
        },
      );

      expect(option.color).toEqual(['#abc123']);
    });
  });

  describe('host style variables', () => {
    it('uses host style variables directly for axis/legend colors', () => {
      const { result } = renderHook(() =>
        useChartTheme(
          makeHostContext({
            theme: 'light',
            styles: {
              variables: makeVariables({
                '--color-text-secondary': 'rgba(1, 2, 3, 1)',
                '--color-text-tertiary': 'rgba(4, 5, 6, 1)',
                '--color-border-secondary': 'rgba(7, 8, 9, 1)',
                '--color-border-tertiary': 'rgba(10, 11, 12, 1)',
              }),
            },
          }),
        ),
      );

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });

      expect(option.legend.textStyle.color).toBe('rgba(1, 2, 3, 1)');
      expect(option.xAxis.axisLabel.color).toBe('rgba(4, 5, 6, 1)');
      expect(option.xAxis.axisLine.lineStyle.color).toBe('rgba(7, 8, 9, 1)');
      expect(option.yAxis.splitLine.lineStyle.color).toBe(
        'rgba(10, 11, 12, 1)',
      );
    });

    it('only overrides the tokens the host actually sends, leaving the rest untouched', () => {
      const { result } = renderHook(() =>
        useChartTheme(
          makeHostContext({
            theme: 'dark',
            styles: {
              variables: makeVariables({
                '--color-text-secondary': 'rgba(1, 2, 3, 1)',
              }),
            },
          }),
        ),
      );

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });

      expect(option.legend.textStyle.color).toBe('rgba(1, 2, 3, 1)');
      expect(option.xAxis.axisLabel).toEqual({});
      expect(option.xAxis.axisLine).toEqual({ lineStyle: {} });
      expect(option.yAxis.splitLine).toEqual({ lineStyle: {} });
    });

    it('picks the light branch of a light-dark() token when theme is "light"', () => {
      const { result } = renderHook(() =>
        useChartTheme(
          makeHostContext({
            theme: 'light',
            styles: {
              variables: makeVariables({
                '--color-text-secondary':
                  'light-dark(rgba(61, 61, 58, 1), rgba(194, 192, 182, 1))',
                '--color-text-tertiary':
                  'light-dark(rgba(115, 114, 108, 1), rgba(156, 154, 146, 1))',
                '--color-border-secondary':
                  'light-dark(rgba(31, 30, 29, 0.3), rgba(222, 220, 209, 0.3))',
                '--color-border-tertiary':
                  'light-dark(rgba(31, 30, 29, 0.15), rgba(222, 220, 209, 0.15))',
              }),
            },
          }),
        ),
      );

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });

      expect(option.legend.textStyle.color).toBe('rgba(61, 61, 58, 1)');
      expect(option.xAxis.axisLabel.color).toBe('rgba(115, 114, 108, 1)');
      expect(option.xAxis.axisLine.lineStyle.color).toBe(
        'rgba(31, 30, 29, 0.3)',
      );
      expect(option.yAxis.splitLine.lineStyle.color).toBe(
        'rgba(31, 30, 29, 0.15)',
      );
    });

    it('picks the dark branch of the same light-dark() token when theme is "dark"', () => {
      const { result } = renderHook(() =>
        useChartTheme(
          makeHostContext({
            theme: 'dark',
            styles: {
              variables: makeVariables({
                '--color-text-secondary':
                  'light-dark(rgba(61, 61, 58, 1), rgba(194, 192, 182, 1))',
                '--color-text-tertiary':
                  'light-dark(rgba(115, 114, 108, 1), rgba(156, 154, 146, 1))',
              }),
            },
          }),
        ),
      );

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });

      expect(option.legend.textStyle.color).toBe('rgba(194, 192, 182, 1)');
      expect(option.xAxis.axisLabel.color).toBe('rgba(156, 154, 146, 1)');
    });

    it('passes a plain (non-light-dark) token value through unchanged', () => {
      const { result } = renderHook(() =>
        useChartTheme(
          makeHostContext({
            theme: 'dark',
            styles: {
              variables: makeVariables({
                '--color-text-secondary': '#123456',
              }),
            },
          }),
        ),
      );

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });

      expect(option.legend.textStyle.color).toBe('#123456');
    });

    it('theme and variables always come from the same hostContext snapshot, so they cannot disagree', () => {
      const { result, rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useChartTheme(ctx),
        {
          initialProps: {
            ctx: makeHostContext({
              theme: 'light',
              styles: {
                variables: makeVariables({
                  '--color-text-secondary': 'rgba(1, 1, 1, 1)',
                }),
              },
            }),
          },
        },
      );

      rerender({
        ctx: makeHostContext({
          theme: 'dark',
          styles: {
            variables: makeVariables({
              '--color-text-secondary': 'rgba(2, 2, 2, 1)',
            }),
          },
        }),
      });

      const option = result.current(CHART_OPTION_SHAPE, { isMobile: false });
      expect(option.legend.textStyle.color).toBe('rgba(2, 2, 2, 1)');
    });

    it('returns a new transformOption identity when hostContext.styles.variables changes', () => {
      const { result, rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useChartTheme(ctx),
        {
          initialProps: {
            ctx: makeHostContext({
              theme: 'light',
              styles: {
                variables: makeVariables({ '--color-text-secondary': 'a' }),
              },
            }),
          },
        },
      );
      const firstTransform = result.current;

      rerender({
        ctx: makeHostContext({
          theme: 'light',
          styles: {
            variables: makeVariables({ '--color-text-secondary': 'b' }),
          },
        }),
      });

      expect(result.current).not.toBe(firstTransform);
    });
  });

  it('themes both xAxis.splitLine and yAxis.axisLine (not just one of each)', () => {
    const { result } = renderHook(() =>
      useChartTheme(
        makeHostContext({
          theme: 'dark',
          styles: {
            variables: makeVariables({
              '--color-border-secondary': '#4a4a4d',
              '--color-border-tertiary': '#333336',
            }),
          },
        }),
      ),
    );

    const option = result.current(
      {
        xAxis: { splitLine: { lineStyle: {} } },
        yAxis: { axisLine: { lineStyle: {} } },
      },
      { isMobile: false },
    );

    expect(option.xAxis.splitLine.lineStyle.color).toBe('#333336');
    expect(option.yAxis.axisLine.lineStyle.color).toBe('#4a4a4d');
  });

  it('sets a compact grid.top regardless of mobile context', () => {
    const { result } = renderHook(() => useChartTheme(undefined));

    const option = result.current({ grid: { top: 80 } }, { isMobile: true });

    expect(option.grid.top).toBe(12);
  });

  it('returns a new transformOption identity when hostContext.theme changes', () => {
    const { result, rerender } = renderHook(
      ({ ctx }: { ctx: McpUiHostContext | undefined }) => useChartTheme(ctx),
      { initialProps: { ctx: makeHostContext({ theme: 'light' }) } },
    );
    const firstTransform = result.current;

    rerender({ ctx: makeHostContext({ theme: 'dark' }) });

    expect(result.current).not.toBe(firstTransform);
  });

  it('handles array-form legend/xAxis/yAxis by theming the first entry', () => {
    const { result } = renderHook(() =>
      useChartTheme(
        makeHostContext({
          theme: 'light',
          styles: {
            variables: makeVariables({
              '--color-text-secondary': '#111111',
              '--color-text-tertiary': '#222222',
            }),
          },
        }),
      ),
    );

    const option = result.current(
      {
        legend: [{ textStyle: {} }],
        xAxis: [{ axisLabel: {}, axisLine: { lineStyle: {} } }],
        yAxis: [{ axisLabel: {}, splitLine: { lineStyle: {} } }],
      },
      { isMobile: false },
    );

    expect(option.legend.textStyle.color).toBe('#111111');
    expect(option.xAxis.axisLabel.color).toBe('#222222');
    expect(option.yAxis.axisLabel.color).toBe('#222222');
  });
});
