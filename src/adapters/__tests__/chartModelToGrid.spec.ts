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
    const result = chartModelToGrid(makeModel({ periods: [] }), null);
    expect(result).toEqual({ data: [], columns: [] });
  });

  it('produces one row per period', () => {
    const result = chartModelToGrid(makeModel(), null);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].period).toBe('2020');
    expect(result.data[1].period).toBe('2021');
  });

  it('includes a period column in the column definitions', () => {
    const { columns } = chartModelToGrid(makeModel(), null);
    const periodCol = columns.find((c) => c.field === 'period');
    expect(periodCol).toBeDefined();
    expect(periodCol?.headerName).toBe('Period');
  });

  it('includes dimension columns with correct field and headerName', () => {
    const { columns } = chartModelToGrid(makeModel(), null);
    const freqCol = columns.find((c) => c.field === 'FREQ');
    expect(freqCol).toBeDefined();
    expect(freqCol?.headerName).toBe('Frequency');
  });

  it('includes a value column without a unit suffix when meta.unit is absent', () => {
    const { columns } = chartModelToGrid(makeModel(), null);
    const valueCol = columns.find((c) => c.field === 'value_0');
    expect(valueCol).toBeDefined();
    expect(valueCol?.headerName).toBe('Value');
  });

  it('appends unit suffix to value column header when meta.unit is set', () => {
    const { columns } = chartModelToGrid(makeModel(), { unit: 'USD' });
    const valueCol = columns.find((c) => c.field === 'value_0');
    expect(valueCol?.headerName).toBe('Value (USD)');
  });

  it('includes agency and dataset_name columns when model has agencyId and datasetName', () => {
    const model = makeModel({ agencyId: 'ESTAT', datasetName: 'Demo Dataset' });
    const { columns } = chartModelToGrid(model, null);
    expect(columns.find((c) => c.field === 'agency')).toBeDefined();
    expect(columns.find((c) => c.field === 'dataset_name')).toBeDefined();
  });

  it('does not include agency or dataset_name columns when those fields are absent', () => {
    const { columns } = chartModelToGrid(makeModel(), null);
    expect(columns.find((c) => c.field === 'agency')).toBeUndefined();
    expect(columns.find((c) => c.field === 'dataset_name')).toBeUndefined();
  });

  it('populates agency and dataset_name row values when present on the model', () => {
    const model = makeModel({ agencyId: 'ESTAT', datasetName: 'Demo Dataset' });
    const { data } = chartModelToGrid(model, null);
    expect(data[0]['agency']).toBe('ESTAT');
    expect(data[0]['dataset_name']).toBe('Demo Dataset');
  });

  it('stores correct numeric values in row data', () => {
    const { data } = chartModelToGrid(makeModel(), null);
    expect(data[0]['value_0']).toBe(10);
    expect(data[1]['value_0']).toBe(20);
  });

  it('stores dimension valueName in row data under the dimension id key', () => {
    const { data } = chartModelToGrid(makeModel(), null);
    expect(data[0]['FREQ']).toBe('Annual');
  });

  it('creates one value column per series', () => {
    const model = makeModel({
      series: [
        { name: 'Series A', dimensions: [], data: [1, 2] },
        { name: 'Series B', dimensions: [], data: [3, 4] },
      ],
    });
    const { columns } = chartModelToGrid(model, null);
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
    const { data } = chartModelToGrid(model, null);
    expect(data[0]['value_0']).toBe(1);
    expect(data[0]['value_1']).toBe(3);
    expect(data[1]['value_0']).toBe(2);
    expect(data[1]['value_1']).toBe(4);
  });
});
