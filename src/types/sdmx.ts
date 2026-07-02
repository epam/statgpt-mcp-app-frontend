import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import type { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';

/**
 * Inputs for `buildCrossDatasetGridContent`/`buildCrossDatasetChartingData`,
 * keyed by dataset URN. Datasets whose structure call failed are included with
 * `undefined` structure — both builders silently skip those datasets, so a
 * partial structure result produces partial output rather than an error.
 */
export interface CrossDatasetInputs {
  structuresMap: Map<string, StructuralData | undefined>;
  dataMessagesMap: Map<string, DataMessage | null>;
  dataQueries: DataQuery[];
}
