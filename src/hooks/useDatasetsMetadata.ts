import { useEffect, useRef, useState } from 'react';
import { bridge } from '../bridge';
import type { BridgePhase } from '../bridge/types';
import {
  buildDatasetDimensionsMetadataMap,
  buildDatasetLastUpdatedMap,
} from '../adapters/datasetsMetadataMap';
import { DATASETS_METADATA_APP_TOOL_NAME } from '../constants/tools';
import { logger } from '../log/logger';
import { truncateForLog } from '../log/truncateForLog';
import type {
  DatasetsMetadataResponse,
  DimensionConfig,
} from '../types/datasetsMetadata';

export interface DatasetsMetadataMaps {
  dimensionsMap: Record<string, Record<string, DimensionConfig>>;
  lastUpdatedMap: Record<string, string>;
}

const EMPTY_MAPS: DatasetsMetadataMaps = {
  dimensionsMap: {},
  lastUpdatedMap: {},
};

/**
 * Fetches the channel's datasets metadata once per widget session — this is
 * channel-level, not query-level, data — and derives the maps
 * `DatasetDimensionsMetadataMapProvider` needs to resolve grid column labels
 * and "last updated" info. Fails soft: on error, the maps stay empty and the
 * grid falls back to unresolved labels.
 */
export function useDatasetsMetadata(phase: BridgePhase): DatasetsMetadataMaps {
  const [maps, setMaps] = useState<DatasetsMetadataMaps>(EMPTY_MAPS);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (phase !== 'ready' || fetchedRef.current) return;
    fetchedRef.current = true;

    void (async () => {
      logger.debug('datasets-metadata', 'request', {
        tool: DATASETS_METADATA_APP_TOOL_NAME,
      });
      const startedAt = performance.now();
      try {
        const data = (await bridge.callToolStructured(
          DATASETS_METADATA_APP_TOOL_NAME,
          {},
        )) as DatasetsMetadataResponse;
        logger.debug('datasets-metadata', 'response', {
          durationMs: Math.round(performance.now() - startedAt),
          response: truncateForLog(data),
        });
        setMaps({
          dimensionsMap: buildDatasetDimensionsMetadataMap(data),
          lastUpdatedMap: buildDatasetLastUpdatedMap(data),
        });
      } catch (e) {
        logger.warn(
          'datasets-metadata',
          'datasets metadata fetch failed — grid columns will render without resolved dimension labels',
          e,
        );
      }
    })();
  }, [phase]);

  return maps;
}
