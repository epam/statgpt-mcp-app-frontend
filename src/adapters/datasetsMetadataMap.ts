import type {
  DatasetsMetadataEntry,
  DatasetsMetadataResponse,
  DimensionConfig,
} from '../types/datasetsMetadata';

/**
 * Produces the "AGENCY:RESOURCE_ID(VERSION)" short-URN format used as
 * `DataQuery.urn` elsewhere in the widget, so these maps can be looked up
 * by the same key the grid/chart builders use.
 */
function datasetToShortUrn(entry: DatasetsMetadataEntry): string {
  const { agencyId, resourceId, version } = entry.dataset.details.urn;
  return `${agencyId}:${resourceId}(${version})`;
}

export function buildDatasetDimensionsMetadataMap(
  data: DatasetsMetadataResponse,
): Record<string, Record<string, DimensionConfig>> {
  const map: Record<string, Record<string, DimensionConfig>> = {};
  for (const entry of data.datasets) {
    map[datasetToShortUrn(entry)] = entry.dataset.details.dimensions;
  }
  return map;
}

export function buildDatasetLastUpdatedMap(
  data: DatasetsMetadataResponse,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const entry of data.datasets) {
    if (entry.last_updated_at) {
      map[datasetToShortUrn(entry)] = entry.last_updated_at;
    }
  }
  return map;
}
