import type { ColDef } from "ag-grid-community";
import type { GridData } from "@epam/statgpt-conversation-view";
import type { ChartMeta, ChartModel } from "../sdmx/parse";

export function chartModelToGrid(
  model: ChartModel,
  meta: ChartMeta | null,
): { data: GridData[]; columns: ColDef[] } {
  if (model.periods.length === 0) return { data: [], columns: [] };

  const unitSuffix = meta?.unit ? ` (${meta.unit})` : "";

  const columns: ColDef[] = [
    { field: "period", headerName: "Period", width: 100 },
    ...model.series.map((s) => ({
      field: s.name,
      headerName: `${s.name}${unitSuffix}`,
      flex: 1,
      type: "numericColumn",
    })),
  ];

  const data: GridData[] = model.periods.map((period, i) => {
    const row: GridData = { period };
    for (const s of model.series) {
      row[s.name] = s.data[i];
    }
    return row;
  });

  return { data, columns };
}
