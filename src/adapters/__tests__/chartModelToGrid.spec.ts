import type { ChartModel } from '../../sdmx/parse';
import { chartModelToGrid } from '../chartModelToGrid';

function makeModel(overrides: Partial<ChartModel> = {}): ChartModel {
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

describe('chartModelToGrid', () => {
  it('returns empty data and columns when periods is empty', () => {
    const result = chartModelToGrid(makeModel({ periods: [] }));
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('produces one row per period', () => {
    const result = chartModelToGrid(makeModel());
    expect(result.data).toHaveLength(2);
    expect(result.data[0].period).toBe('2020');
    expect(result.data[1].period).toBe('2021');
  });

  it('includes a period column in the column definitions', () => {
    const { columns } = chartModelToGrid(makeModel());
    const periodCol = columns.find((c) => c.field === 'period');
    expect(periodCol).toBeDefined();
    expect(periodCol?.headerName).toBe('Period');
  });

  it('includes dimension columns for single-series models', () => {
    const { columns } = chartModelToGrid(makeModel());
    const freqCol = columns.find((c) => c.field === 'FREQ');
    expect(freqCol).toBeDefined();
    expect(freqCol?.headerName).toBe('Frequency');
  });

  it('labels the value column "Value" for single-series models', () => {
    const { columns } = chartModelToGrid(makeModel());
    const valueCol = columns.find((c) => c.field === 'value_0');
    expect(valueCol).toBeDefined();
    expect(valueCol?.headerName).toBe('Value');
  });

  it('includes agency and dataset_name columns when model has agencyId and datasetName', () => {
    const model = makeModel({ agencyId: 'ESTAT', datasetName: 'Demo Dataset' });
    const { columns } = chartModelToGrid(model);
    expect(columns.find((c) => c.field === 'agency')).toBeDefined();
    expect(columns.find((c) => c.field === 'dataset_name')).toBeDefined();
  });

  it('does not include agency or dataset_name columns when those fields are absent', () => {
    const { columns } = chartModelToGrid(makeModel());
    expect(columns.find((c) => c.field === 'agency')).toBeUndefined();
    expect(columns.find((c) => c.field === 'dataset_name')).toBeUndefined();
  });

  it('populates agency and dataset_name row values when present on the model', () => {
    const model = makeModel({ agencyId: 'ESTAT', datasetName: 'Demo Dataset' });
    const { data } = chartModelToGrid(model);
    expect(data[0]['agency']).toBe('ESTAT');
    expect(data[0]['dataset_name']).toBe('Demo Dataset');
  });

  it('stores correct numeric values in row data', () => {
    const { data } = chartModelToGrid(makeModel());
    expect(data[0]['value_0']).toBe(10);
    expect(data[1]['value_0']).toBe(20);
  });

  it('stores dimension valueName in row data under the dimension id key for single-series', () => {
    const { data } = chartModelToGrid(makeModel());
    expect(data[0]['FREQ']).toBe('Annual');
  });

  it('creates one value column per series', () => {
    const model = makeModel({
      series: [
        { name: 'Series A', dimensions: [], data: [1, 2] },
        { name: 'Series B', dimensions: [], data: [3, 4] },
      ],
    });
    const { columns } = chartModelToGrid(model);
    expect(columns.find((c) => c.field === 'value_0')).toBeDefined();
    expect(columns.find((c) => c.field === 'value_1')).toBeDefined();
  });

  it('maps each series value to the correct row', () => {
    const model = makeModel({
      series: [
        { name: 'Series A', dimensions: [], data: [1, 2] },
        { name: 'Series B', dimensions: [], data: [3, 4] },
      ],
    });
    const { data } = chartModelToGrid(model);
    expect(data[0]['value_0']).toBe(1);
    expect(data[0]['value_1']).toBe(3);
    expect(data[1]['value_0']).toBe(2);
    expect(data[1]['value_1']).toBe(4);
  });

  it('omits dimension columns for multi-series and labels value columns with series labels', () => {
    const model = makeModel({
      series: [
        {
          name: 'Series A',
          dimensions: [
            {
              id: 'COUNTRY',
              name: 'Country',
              valueId: 'DEU',
              valueName: 'Germany',
            },
          ],
          data: [1, 2],
        },
        {
          name: 'Series B',
          dimensions: [
            {
              id: 'COUNTRY',
              name: 'Country',
              valueId: 'FRA',
              valueName: 'France',
            },
          ],
          data: [3, 4],
        },
      ],
    });
    const { columns } = chartModelToGrid(model);
    expect(columns.find((c) => c.field === 'COUNTRY')).toBeUndefined();
    expect(columns.find((c) => c.field === 'value_0')?.headerName).toBe(
      'Germany',
    );
    expect(columns.find((c) => c.field === 'value_1')?.headerName).toBe(
      'France',
    );
  });

  it('does not include dimension values in row data for multi-series', () => {
    const model = makeModel({
      series: [
        {
          name: 'Series A',
          dimensions: [
            {
              id: 'COUNTRY',
              name: 'Country',
              valueId: 'DEU',
              valueName: 'Germany',
            },
          ],
          data: [1, 2],
        },
        {
          name: 'Series B',
          dimensions: [
            {
              id: 'COUNTRY',
              name: 'Country',
              valueId: 'FRA',
              valueName: 'France',
            },
          ],
          data: [3, 4],
        },
      ],
    });
    const { data } = chartModelToGrid(model);
    expect(data[0]['COUNTRY']).toBeUndefined();
  });
});
