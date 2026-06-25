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
    const result = chartModelToCrossDatasetGrid(
      makeModel({ series: [] }),
      null,
    );
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('returns empty data and columns when periods is empty', () => {
    const result = chartModelToCrossDatasetGrid(
      makeModel({ periods: [] }),
      null,
    );
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
    const { data } = chartModelToCrossDatasetGrid(model, null);
    expect(data).toHaveLength(2);
  });

  it('includes one period column per period with field keys p_2020 and p_2021', () => {
    const { columns } = chartModelToCrossDatasetGrid(makeModel(), null);
    const periodFields = columns
      .map((c) => c.field)
      .filter((f) => f?.startsWith('p_'));
    expect(periodFields).toEqual(['p_2020', 'p_2021']);
  });

  it('pins dimension columns to the left', () => {
    const { columns } = chartModelToCrossDatasetGrid(makeModel(), null);
    const dimColumns = columns.filter((c) => !c.field?.startsWith('p_'));
    expect(dimColumns.length).toBeGreaterThan(0);
    for (const col of dimColumns) {
      expect(col.pinned).toBe('left');
    }
  });

  it('appends unit suffix to period column headers when meta.unit is provided', () => {
    const { columns } = chartModelToCrossDatasetGrid(makeModel(), {
      unit: 'USD',
    });
    const periodColumns = columns.filter((c) => c.field?.startsWith('p_'));
    for (const col of periodColumns) {
      expect(col.headerName).toMatch(/\(USD\)$/);
    }
  });

  it('does not append unit suffix to period column headers when meta has no unit', () => {
    const { columns } = chartModelToCrossDatasetGrid(makeModel(), null);
    const periodColumns = columns.filter((c) => c.field?.startsWith('p_'));
    for (const col of periodColumns) {
      expect(col.headerName).not.toMatch(/\(/);
    }
  });

  it('places the correct numeric value at the matching period field key in each row', () => {
    const { data } = chartModelToCrossDatasetGrid(makeModel(), null);
    expect(data[0]['p_2020']).toBe(10);
    expect(data[0]['p_2021']).toBe(20);
  });

  it('maps dimension valueName to the dimension id field in each row', () => {
    const { data } = chartModelToCrossDatasetGrid(makeModel(), null);
    expect(data[0]['FREQ']).toBe('Annual');
  });
});
