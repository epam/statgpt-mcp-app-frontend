import { getParsedResponse, sortPeriods } from "@epam/statgpt-sdmx-toolkit";
import type { DataMessage } from "@epam/statgpt-sdmx-toolkit";
import type { SdmxQuery, WidgetToolResult } from "../bridge/types";

export interface ChartModel {
  periods: string[];
  series: { name: string; data: (number | null)[] }[];
}

export interface WidgetMeta {
  title?: string;
  queries: SdmxQuery[];
  sdmxProxyToolName: string;
}

export function extractWidgetMeta(toolResult: unknown): WidgetMeta | null {
  if (!toolResult || typeof toolResult !== "object") return null;
  const t = toolResult as Partial<WidgetToolResult>;
  if (!Array.isArray(t.queries) || !t.tools?.sdmx_proxy) return null;
  return {
    title: typeof t.title === "string" ? t.title : undefined,
    queries: t.queries,
    sdmxProxyToolName: t.tools.sdmx_proxy,
  };
}

export function normalizeSdmxDataResponse(raw: unknown): ChartModel {
  if (!raw || typeof raw !== "object") return { periods: [], series: [] };

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
      const raw = v.values[0]?.value;
      byPeriod.set(
        v.dimensionAtObservation,
        raw == null || raw === "" ? null : Number(raw),
      );
    }
    return {
      name: ts.name,
      data: periods.map((p) => byPeriod.get(p) ?? null),
    };
  });

  return { periods, series };
}
