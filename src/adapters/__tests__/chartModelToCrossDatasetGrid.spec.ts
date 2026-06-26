import { chartModelToCrossDatasetGrid } from '../chartModelToCrossDatasetGrid';
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

describe('chartModelToCrossDatasetGrid', () => {
  it('returns empty data and columns when series is empty', () => {
    const result = chartModelToCrossDatasetGrid(makeModel({ series: [] }));
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('returns empty data and columns when periods is empty', () => {
    const result = chartModelToCrossDatasetGrid(makeModel({ periods: [] }));
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('produces one row per series, not per period', () => {
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
          ],
          data: [10, 20],
        },
        {
          name: 'Series B',
          dimensions: [
            {
              id: 'FREQ',
              name: 'Frequency',
              valueId: 'Q',
              valueName: 'Quarterly',
            },
          ],
          data: [30, 40],
        },
      ],
    });
    const { data } = chartModelToCrossDatasetGrid(model);
    expect(data).toHaveLength(2);
  });

  it('includes one period column per period with field keys p_2020 and p_2021', () => {
    const { columns } = chartModelToCrossDatasetGrid(makeModel());
    const periodFields = columns
      .map((c) => c.field)
      .filter((f) => f?.startsWith('p_'));
    expect(periodFields).toEqual(['p_2020', 'p_2021']);
  });

  it('uses the period value as the period column header', () => {
    const { columns } = chartModelToCrossDatasetGrid(makeModel());
    const periodColumns = columns.filter((c) => c.field?.startsWith('p_'));
    expect(periodColumns[0].headerName).toBe('2020');
    expect(periodColumns[1].headerName).toBe('2021');
  });

  it('places the correct numeric value at the matching period field key in each row', () => {
    const { data } = chartModelToCrossDatasetGrid(makeModel());
    expect(data[0]['p_2020']).toBe(10);
    expect(data[0]['p_2021']).toBe(20);
  });

  it('maps dimension valueName to the dimension id field in each row', () => {
    const { data } = chartModelToCrossDatasetGrid(makeModel());
    expect(data[0]['FREQ']).toBe('Annual');
  });
});
