import type { SdmxQuery } from "../bridge/types";

export function dataPath(q: SdmxQuery["sdmx"]): string {
  const base = `/sdmx/3.0/data/dataflow/${q.agency_id}/${q.resource_id}/${q.version}/${q.key}`;
  const params = new URLSearchParams({ attributes: "all", ...(q.params ?? {}) });
  return `${base}?${params}`;
}
