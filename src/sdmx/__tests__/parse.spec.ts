import { getParsedResponse } from '@epam/statgpt-sdmx-toolkit';
import { normalizeSdmxDataResponse, mergeChartModels } from '../parse';

vi.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getParsedResponse: vi.fn(),
  sortPeriods: (a: string, b: string) => a.localeCompare(b),
}));

describe('normalizeSdmxDataResponse', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns empty model for null input', () => {
    expect(normalizeSdmxDataResponse(null)).toEqual({
      periods: [],
      series: [],
    });
  });

  it('returns empty model when getParsedResponse returns an empty array', () => {
    vi.mocked(getParsedResponse).mockReturnValue([]);
    expect(normalizeSdmxDataResponse({})).toEqual({ periods: [], series: [] });
  });

  it('returns correct periods and series structure for one time series', () => {
    vi.mocked(getParsedResponse).mockReturnValue([
      {
        name: 'Series A',
        parsedTimeSeriesValue: ['VAL1'],
        values: [{ dimensionAtObservation: '2020', values: [{ value: '42' }] }],
      },
    ] as ReturnType<typeof getParsedResponse>);

    const model = normalizeSdmxDataResponse({});

    expect(model.periods).toEqual(['2020']);
    expect(model.series).toHaveLength(1);
    expect(model.series[0].name).toBe('Series A');
    expect(model.series[0].data).toEqual([42]);
  });
});

describe('mergeChartModels', () => {
  it('returns empty model for empty array', () => {
    expect(mergeChartModels([])).toEqual({ periods: [], series: [] });
  });

  it('returns the same model when given a single-element array', () => {
    const model = {
      periods: ['2020'],
      series: [{ name: 'A', dimensions: [], data: [1] }],
    };
    expect(mergeChartModels([model])).toBe(model);
  });

  it('unions periods from multiple models and sorts them', () => {
    const m1 = {
      periods: ['2021', '2020'],
      series: [{ name: 'A', dimensions: [], data: [2, 1] }],
    };
    const m2 = {
      periods: ['2022', '2021'],
      series: [{ name: 'B', dimensions: [], data: [4, 3] }],
    };
    const result = mergeChartModels([m1, m2]);
    expect(result.periods).toEqual(['2020', '2021', '2022']);
  });

  it('concatenates series from all models', () => {
    const m1 = {
      periods: ['2020'],
      series: [{ name: 'A', dimensions: [], data: [1] }],
    };
    const m2 = {
      periods: ['2020'],
      series: [{ name: 'B', dimensions: [], data: [2] }],
    };
    const result = mergeChartModels([m1, m2]);
    expect(result.series).toHaveLength(2);
    expect(result.series[0].name).toBe('A');
    expect(result.series[1].name).toBe('B');
  });

  it('fills null for periods missing from a source model', () => {
    const m1 = {
      periods: ['2020'],
      series: [{ name: 'A', dimensions: [], data: [1] }],
    };
    const m2 = {
      periods: ['2021'],
      series: [{ name: 'B', dimensions: [], data: [2] }],
    };
    const result = mergeChartModels([m1, m2]);
    expect(result.periods).toEqual(['2020', '2021']);
    expect(result.series[0].data).toEqual([1, null]);
    expect(result.series[1].data).toEqual([null, 2]);
  });

  it('takes agencyId and datasetName from the first model', () => {
    const m1 = {
      agencyId: 'IMF',
      datasetName: 'GDP',
      periods: ['2020'],
      series: [],
    };
    const m2 = {
      agencyId: 'ESTAT',
      datasetName: 'CPI',
      periods: ['2020'],
      series: [],
    };
    const result = mergeChartModels([m1, m2]);
    expect(result.agencyId).toBe('IMF');
    expect(result.datasetName).toBe('GDP');
  });
});
