import { getParsedResponse, sortPeriods } from "@epam/statgpt-sdmx-toolkit";
import type { DataMessage } from "@epam/statgpt-sdmx-toolkit";
import type { SdmxQuery, WidgetToolResult } from "../bridge/types";

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
  series: { name: string; dimensions: ChartDimension[]; data: (number | null)[] }[];
}

export interface WidgetMeta {
  title?: string;
  queries: SdmxQuery[];
  sdmxProxyToolName: string;
}

export function extractWidgetMeta(toolResult: unknown): WidgetMeta | null {
  if (!toolResult || typeof toolResult !== "object") return null;
  const r = toolResult as Record<string, unknown>;
  // Unwrap notification-params envelope { content, structuredContent, isError }
  // if the direct object doesn't carry the WidgetToolResult fields.
  const candidate = (
    !Array.isArray(r.queries) &&
    r.structuredContent != null &&
    typeof r.structuredContent === "object"
  ) ? r.structuredContent : toolResult;
  const t = candidate as Partial<WidgetToolResult>;
  if (!Array.isArray(t.queries) || !t.tools?.sdmx_proxy) return null;
  return {
    title: typeof t.title === "string" ? t.title : undefined,
    queries: t.queries,
    sdmxProxyToolName: t.tools.sdmx_proxy,
  };
}

export function normalizeSdmxDataResponse(raw: unknown): ChartModel {
  if (!raw || typeof raw !== "object") return { periods: [], series: [] };

  const r = raw as Record<string, unknown>;
  const dataBlock = r.data as Record<string, unknown> | undefined;
  const structures = dataBlock?.structures as Record<string, unknown>[] | undefined;
  const structure0 = structures?.[0];
  const datasetName = typeof structure0?.name === "string" ? structure0.name : undefined;
  const dataflowUrn = (
    (structure0?.links as Record<string, unknown>[] | undefined)?.[0]?.urn as string | undefined
  );
  // URN format: "urn:sdmx:...=AGENCY:RESOURCE_ID(VERSION)"
  const agencyId = dataflowUrn?.split("=")?.[1]?.split(":")?.[0];
  const seriesDimDefs = (
    (structure0?.dimensions as Record<string, unknown> | undefined)?.series as Record<string, unknown>[]
  ) ?? [];

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
        obsValue == null || obsValue === "" ? null : Number(obsValue),
      );
    }

    const dimensions: ChartDimension[] = ts.parsedTimeSeriesValue.map((valueId, i) => {
      const dimDef = seriesDimDefs[i] ?? {};
      const dimValues = (dimDef.values as Record<string, unknown>[]) ?? [];
      const valueDef = dimValues.find((v) => v.id === valueId) ?? {};
      return {
        id: String(dimDef.id ?? `dim_${i}`),
        name: String(dimDef.name ?? `Dimension ${i}`),
        valueId,
        valueName: String(valueDef.name ?? valueId),
      };
    });

    return {
      name: ts.name,
      dimensions,
      data: periods.map((p) => byPeriod.get(p) ?? null),
    };
  });

  return { agencyId, datasetName, periods, series };
}
