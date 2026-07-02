import type { SdmxQuery } from '../bridge/types';

/**
 * Builds the dataflow URN key used to correlate a query's data message,
 * structure, and `DataQuery` across the maps passed into
 * `buildCrossDatasetGridContent`/`buildCrossDatasetChartingData`.
 *
 * @param q - SDMX query parameters containing agency ID, resource ID, and version.
 * @returns A URN string of the form `<agency>:<resource>(<version>)`.
 */
export function datasetUrn(q: SdmxQuery['sdmx']): string {
  return `${q.agency_id}:${q.resource_id}(${q.version})`;
}
