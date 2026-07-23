/**
 * Shape of the `datasets_metadata_app` MCP tool's structured content — matches the
 * `/metadata/datasets` service endpoint response. Only the fields this widget
 * actually reads are declared; the real payload carries more.
 */
export interface DimensionConfig {
  alias: string | null;
  subtype?: string | null;
  allValues: { id: string; name: string; description: string } | null;
  dimensionType: string;
}

export interface DatasetsMetadataEntry {
  dataset: {
    details: {
      urn: {
        agencyId: string;
        resourceId: string;
        version: string;
      };
      dimensions: Record<string, DimensionConfig>;
    };
  };
  last_updated_at?: string | null;
}

export interface DatasetsMetadataResponse {
  deployment_id: string;
  title: string;
  n_datasets: number;
  datasets: DatasetsMetadataEntry[];
}
