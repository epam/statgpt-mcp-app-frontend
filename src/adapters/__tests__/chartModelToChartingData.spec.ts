import { chartModelToChartingData } from '../chartModelToChartingData';
import { MAX_PERIODS_WITH_SYMBOLS } from '../../constants/chart';
import type { ChartModel } from '../../sdmx/parse';

function makeModel(overrides = {}): ChartModel {
  return {
    periods: ['2020', '2021'],
    series: [
      {
        name: 'Series A',
        dimensions: [
          { id: 'FREQ', name: 'Frequency', valueId: 'A', valueName: 'Annual' },
        ],
        data: [10, 20],
      },
    ],
    ...overrides,
  };
}

describe('chartModelToChartingData', () => {
  it('returns { units: [] } for empty periods', () => {
    const result = chartModelToChartingData(makeModel({ periods: [] }));
    expect(result).toEqual({ units: [] });
  });

  it('returns { units: [] } for empty series', () => {
    const result = chartModelToChartingData(makeModel({ series: [] }));
    expect(result).toEqual({ units: [] });
  });

  it('produces one ChartUnit per series', () => {
    const model = makeModel({
      series: [
        { name: 'Series A', dimensions: [], data: [1, 2] },
        { name: 'Series B', dimensions: [], data: [3, 4] },
      ],
    });
    const result = chartModelToChartingData(model);
    expect(result.units).toHaveLength(2);
  });

  it('uses joined dimension valueNames as the series label when dimensions are present', () => {
    const model = makeModel({
      series: [
        {
          name: 'Series A',
          dimensions: [
            {
              id: 'FREQ',
              name: 'Frequency',
              valueId: 'A',
              valueName: 'Annual',
            },
            {
              id: 'REF_AREA',
              name: 'Region',
              valueId: 'UA',
              valueName: 'Ukraine',
            },
          ],
          data: [10, 20],
        },
      ],
    });
    const result = chartModelToChartingData(model);
    const config = result.units[0].config as Record<string, unknown>;
    const series = (config.series as Array<Record<string, unknown>>)[0];
    expect(series.name).toBe('Annual — Ukraine');
  });

  it('falls back to series.name when dimensions array is empty', () => {
    const model = makeModel({
      series: [{ name: 'My Series', dimensions: [], data: [10, 20] }],
    });
    const result = chartModelToChartingData(model);
    const config = result.units[0].config as Record<string, unknown>;
    const series = (config.series as Array<Record<string, unknown>>)[0];
    expect(series.name).toBe('My Series');
  });

  it('sets showSymbol to true when period count is at or below MAX_PERIODS_WITH_SYMBOLS', () => {
    const periods = Array.from({ length: MAX_PERIODS_WITH_SYMBOLS }, (_, i) =>
      String(2000 + i),
    );
    const model = makeModel({ periods });
    const result = chartModelToChartingData(model);
    const config = result.units[0].config as Record<string, unknown>;
    const series = (config.series as Array<Record<string, unknown>>)[0];
    expect(series.showSymbol).toBe(true);
  });

  it('sets showSymbol to false when period count exceeds MAX_PERIODS_WITH_SYMBOLS', () => {
    const periods = Array.from(
      { length: MAX_PERIODS_WITH_SYMBOLS + 1 },
      (_, i) => String(2000 + i),
    );
    const model = makeModel({ periods });
    const result = chartModelToChartingData(model);
    const config = result.units[0].config as Record<string, unknown>;
    const series = (config.series as Array<Record<string, unknown>>)[0];
    expect(series.showSymbol).toBe(false);
  });

  it('sets connectNulls to false', () => {
    const result = chartModelToChartingData(makeModel());
    const config = result.units[0].config as Record<string, unknown>;
    const series = (config.series as Array<Record<string, unknown>>)[0];
    expect(series.connectNulls).toBe(false);
  });

  it('sets animation to false', () => {
    const result = chartModelToChartingData(makeModel());
    const config = result.units[0].config as Record<string, unknown>;
    expect(config.animation).toBe(false);
  });
});
