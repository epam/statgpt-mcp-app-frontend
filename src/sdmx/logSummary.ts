import type { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';

/**
 * Reduces a `DataMessage` to counts suitable for a debug log line, avoiding
 * dumping the full (potentially large) observation payload to the console.
 */
export function summarizeDataMessage(msg: DataMessage): Record<string, number> {
  const dataSets = msg.data?.dataSets ?? [];
  let seriesCount = 0;
  let observationCount = 0;
  for (const ds of dataSets) {
    const series = ds.series ?? {};
    seriesCount += Object.keys(series).length;
    for (const s of Object.values(series)) {
      observationCount += Object.keys(s.observations ?? {}).length;
    }
  }
  return { dataSets: dataSets.length, seriesCount, observationCount };
}

/**
 * Reduces a `StructuralData` payload to counts suitable for a debug log line.
 */
export function summarizeStructuralData(
  data: StructuralData,
): Record<string, number> {
  return {
    codelists: data.codelists?.length ?? 0,
    dataStructures: data.dataStructures?.length ?? 0,
    dataflows: data.dataflows?.length ?? 0,
  };
}
