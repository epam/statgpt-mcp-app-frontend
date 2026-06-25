import { getParsedResponse, sortPeriods } from '@epam/statgpt-sdmx-toolkit';
import type { DataMessage } from '@epam/statgpt-sdmx-toolkit';

export interface ChartDimension {
  id: string;
  name: string;
  valueId: string;
  valueName: string;
}

export interface ChartModel {
  agencyId?: string;
  datasetName?: string;
  periods: string[];
  series: {
    name: string;
    dimensions: ChartDimension[];
    data: (number | null)[];
  }[];
}

/**
 * Converts a raw SDMX JSON data response into the internal `ChartModel` representation,
 * extracting time periods, series data, dimension labels, and the agency ID from the dataflow URN.
 *
 * @param raw - The untyped SDMX JSON data response object.
 * @returns A `ChartModel` with periods, series, dimension metadata, dataset name, and agency ID.
 */
export function normalizeSdmxDataResponse(raw: unknown): ChartModel {
  if (!raw || typeof raw !== 'object') return { periods: [], series: [] };

  const r = raw as Record<string, unknown>;
  const dataBlock = r.data as Record<string, unknown> | undefined;
  const structures = dataBlock?.structures as
    | Record<string, unknown>[]
    | undefined;
  const structure0 = structures?.[0];
  const datasetName =
    typeof structure0?.name === 'string' ? structure0.name : undefined;
  const dataflowUrn = (
    structure0?.links as Record<string, unknown>[] | undefined
  )?.[0]?.urn as string | undefined;
  const agencyId = dataflowUrn?.split('=')?.[1]?.split(':')?.[0];
  const seriesDimDefs =
    ((structure0?.dimensions as Record<string, unknown> | undefined)
      ?.series as Record<string, unknown>[]) ?? [];

  const timeSeries = getParsedResponse(raw as DataMessage);
  if (!timeSeries.length) return { periods: [], series: [] };

  const periodSet = new Set<string>();
  for (const ts of timeSeries) {
    for (const v of ts.values) {
      if (v.dimensionAtObservation) periodSet.add(v.dimensionAtObservation);
    }
  }
  const periods = Array.from(periodSet).sort(sortPeriods);

  const series = timeSeries.map((ts) => {
    const byPeriod = new Map<string, number | null>();
    for (const v of ts.values) {
      if (!v.dimensionAtObservation) continue;
      const obsValue = v.values[0]?.value;
      byPeriod.set(
        v.dimensionAtObservation,
        obsValue == null || obsValue === '' ? null : Number(obsValue),
      );
    }

    const dimensions: ChartDimension[] = ts.parsedTimeSeriesValue.map(
      (valueId, i) => {
        const dimDef = seriesDimDefs[i] ?? {};
        const dimValues = (dimDef.values as Record<string, unknown>[]) ?? [];
        const valueDef = dimValues.find((v) => v.id === valueId) ?? {};
        return {
          id: String(dimDef.id ?? `dim_${i}`),
          name: String(dimDef.name ?? `Dimension ${i}`),
          valueId,
          valueName: String(valueDef.name ?? valueId),
        };
      },
    );

    return {
      name: ts.name,
      dimensions,
      data: periods.map((p) => byPeriod.get(p) ?? null),
    };
  });

  return { agencyId, datasetName, periods, series };
}

/**
 * Merges multiple `ChartModel` instances into one by taking the union of all
 * time periods and concatenating all series. Useful when multiple SDMX queries
 * are fetched in parallel and their results need to be displayed together.
 *
 * @param models - Array of `ChartModel` instances to merge.
 * @returns A single `ChartModel` containing all series across the unified period axis.
 */
export function mergeChartModels(models: ChartModel[]): ChartModel {
  if (models.length === 0) return { periods: [], series: [] };
  if (models.length === 1) return models[0];

  const periodSet = new Set<string>();
  for (const m of models) {
    for (const p of m.periods) periodSet.add(p);
  }
  const periods = Array.from(periodSet).sort(sortPeriods);

  const series = models.flatMap((m) =>
    m.series.map((s) => ({
      ...s,
      data: periods.map((p) => {
        const idx = m.periods.indexOf(p);
        return idx >= 0 ? (s.data[idx] ?? null) : null;
      }),
    })),
  );

  return {
    agencyId: models[0].agencyId,
    datasetName: models[0].datasetName,
    periods,
    series,
  };
}
