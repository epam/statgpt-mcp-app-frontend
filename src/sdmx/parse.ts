// Turns the host payloads into a chart-ready model.
//
// Two payload shapes are handled:
//  - The chart *metadata* (structuredContent of get_chart_data): title, unit,
//    frequency, country, the SDMX `query`, and `fetch_tool_name`.
//  - The *data* (structuredContent of fetch_sdmx_data). In this prototype the
//    proxy Lambda returns a simplified shape:
//        { series: [ { name, key: {COUNTRY,INDICATOR}, points: [{period,value}] } ] }
//    A production SDMX backend would instead return SDMX-JSON; `getParsedResponse`
//    from @epam/statgpt-sdmx-toolkit is the path for that (see normalizeFetchResult).
import { sortPeriods } from "@epam/statgpt-sdmx-toolkit";

export interface ChartQuery {
  country?: string;
  indicator?: string;
  [k: string]: unknown;
}

export interface ChartMeta {
  title?: string;
  unit?: string;
  frequency?: string;
  country?: string;
  countryName?: string;
  query?: ChartQuery;
  fetchToolName?: string;
}

export interface ChartModel {
  periods: string[];
  series: { name: string; data: (number | null)[] }[];
}

interface RawPoint {
  period: string | number;
  value: number | string | null;
}
interface RawSeries {
  name?: string;
  key?: Record<string, string>;
  points?: RawPoint[];
}

function str(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

/** Pull chart metadata out of a get_chart_data structuredContent payload. */
export function extractChartMeta(toolResult: unknown): ChartMeta | null {
  if (!toolResult || typeof toolResult !== "object") return null;
  const t = toolResult as Record<string, unknown>;
  return {
    title: str(t.title),
    unit: str(t.unit),
    frequency: str(t.frequency),
    country: str(t.country),
    countryName: str(t.country_name),
    query:
      t.query && typeof t.query === "object" ? (t.query as ChartQuery) : undefined,
    fetchToolName: str(t.fetch_tool_name),
  };
}

/** Normalize the fetch_sdmx_data result into periods + line series. */
export function normalizeFetchResult(raw: unknown): ChartModel {
  if (!raw || typeof raw !== "object") return { periods: [], series: [] };
  const r = raw as Record<string, unknown>;

  if (r.error) {
    throw new Error(String(r.message || r.error));
  }

  const rawSeries: RawSeries[] = Array.isArray(r.series) ? (r.series as RawSeries[]) : [];

  const periodSet = new Set<string>();
  for (const s of rawSeries) {
    for (const p of s.points ?? []) periodSet.add(String(p.period));
  }
  // sortPeriods (toolkit) orders SDMX period strings chronologically across
  // frequencies (annual / quarterly / monthly), not just lexically.
  const periods = Array.from(periodSet).sort(sortPeriods);

  const series = rawSeries.map((s) => {
    const byPeriod = new Map<string, number | null>();
    for (const p of s.points ?? []) {
      const v = p.value;
      byPeriod.set(String(p.period), v === null || v === "" ? null : Number(v));
    }
    const name =
      s.name ?? (s.key ? Object.values(s.key).join(" / ") : "series");
    return {
      name,
      data: periods.map((per) => (byPeriod.has(per) ? byPeriod.get(per)! : null)),
    };
  });

  return { periods, series };
}
