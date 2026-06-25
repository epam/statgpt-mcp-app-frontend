import type { ColDef } from 'ag-grid-community';
import type { GridData } from '@epam/statgpt-conversation-view';
import type { ChartModel } from '../sdmx/parse';

const periodFieldKey = (period: string) => `p_${period}`;

export function chartModelToCrossDatasetGrid(
  model: ChartModel,
  meta: { unit?: string } | null,
): { data: GridData[]; columns: ColDef[] } {
  if (model.series.length === 0 || model.periods.length === 0) {
    return { data: [], columns: [] };
  }

  const unitSuffix = meta?.unit ? ` (${meta.unit})` : '';
  const dimDefs = model.series[0]?.dimensions ?? [];

  const dimensionColumns: ColDef[] = dimDefs.map((dim) => ({
    field: dim.id,
    headerName: dim.name,
    width: 160,
    pinned: 'left' as const,
  }));

  const periodColumns: ColDef[] = model.periods.map((period) => ({
    field: periodFieldKey(period),
    headerName: `${period}${unitSuffix}`,
    headerTooltip: period,
    width: 100,
    type: 'numericColumn',
  }));

  const columns: ColDef[] = [...dimensionColumns, ...periodColumns];

  const data: GridData[] = model.series.map((s) => {
    const row: GridData = {};
    for (const dim of s.dimensions) {
      row[dim.id] = dim.valueName;
    }
    for (let i = 0; i < model.periods.length; i++) {
      row[periodFieldKey(model.periods[i])] = s.data[i];
    }
    return row;
  });

  return { data, columns };
}
