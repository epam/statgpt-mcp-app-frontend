import type { ColDef } from 'ag-grid-community';
import type { GridData } from '@epam/statgpt-conversation-view';
import type { ChartModel } from '../sdmx/parse';

/**
 * Converts a normalized `ChartModel` into AG Grid-compatible row data and column definitions,
 * producing one row per time period with each series value in a separate column.
 *
 * For single-series models, dimension columns are included and the value column is labeled
 * "Value". For multi-series models, dimension columns are omitted (since each series has its
 * own dimension values) and each value column is labeled with the series' dimension values
 * joined by " — ", or the series name when dimensions are absent.
 *
 * @param model - The normalized internal chart model containing periods, series, and dataset metadata.
 */
export function chartModelToGrid(model: ChartModel): {
  data: GridData[];
  columns: ColDef[];
} {
  if (model.periods.length === 0) return { data: [], columns: [] };

  const isSingleSeries = model.series.length === 1;
  const seriesFieldKey = (i: number) => `value_${i}`;

  const seriesLabel = (s: ChartModel['series'][number]) =>
    s.dimensions.length > 0
      ? s.dimensions.map((d) => d.valueName).join(' — ')
      : s.name;

  const dimDefs = isSingleSeries ? (model.series[0]?.dimensions ?? []) : [];
  const dimensionColumns: ColDef[] = dimDefs.map((dim) => ({
    field: dim.id,
    headerName: dim.name,
    flex: 1,
  }));

  const valueColumns: ColDef[] = model.series.map((s, i) => ({
    field: seriesFieldKey(i),
    headerName: isSingleSeries ? 'Value' : seriesLabel(s),
    flex: 1,
    type: 'numericColumn',
  }));

  const columns: ColDef[] = [
    ...(model.agencyId
      ? [{ field: 'agency', headerName: 'Agency', width: 100 }]
      : []),
    ...(model.datasetName
      ? [{ field: 'dataset_name', headerName: 'Dataset', flex: 2 }]
      : []),
    ...dimensionColumns,
    { field: 'period', headerName: 'Period', width: 120 },
    ...valueColumns,
  ];

  const data: GridData[] = model.periods.map((period, i) => {
    const row: GridData = { period };
    if (model.agencyId) row['agency'] = model.agencyId;
    if (model.datasetName) row['dataset_name'] = model.datasetName;
    if (isSingleSeries) {
      for (const dim of model.series[0]?.dimensions ?? []) {
        row[dim.id] = dim.valueName;
      }
    }
    for (let si = 0; si < model.series.length; si++) {
      row[seriesFieldKey(si)] = model.series[si].data[i];
    }
    return row;
  });

  return { data, columns };
}
