import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import type { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import type { CrossDatasetInputs } from '../types/sdmx';
import { bridge } from '../bridge';
import { useBridgeSnapshot } from '../bridge/useBridge';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { BridgeSnapshot, WidgetMeta } from '../bridge/types';
import { extractWidgetMeta } from '../bridge/parseToolResult';
import { dataPath, structurePath } from '../sdmx/buildPaths';
import { datasetUrn } from '../sdmx/urn';
import {
  mockMeta,
  mockStructuralData,
  mockDataMessage,
} from '../mocks/sdmxData';
import {
  MOCK_HOST_CONTEXT_DARK,
  MOCK_HOST_CONTEXT_LIGHT,
} from '../mocks/hostContext';

const USE_DEV_MODE =
  import.meta.env.DEV &&
  typeof window !== 'undefined' &&
  window.parent === window;

const DEV_THEME =
  typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('theme') ?? 'light')
    : 'light';

const DEV_DISPLAY_MODE =
  typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('mode') ?? 'fullscreen')
    : 'fullscreen';

const DEV_BASE_CONTEXT =
  DEV_THEME === 'dark' ? MOCK_HOST_CONTEXT_DARK : MOCK_HOST_CONTEXT_LIGHT;

const DEV_SNAPSHOT: BridgeSnapshot = {
  phase: 'ready',
  toolResult: null,
  hostContext: {
    ...DEV_BASE_CONTEXT,
    displayMode: DEV_DISPLAY_MODE as McpUiHostContext['displayMode'],
  },
};

export interface SdmxData {
  snapshot: BridgeSnapshot;
  meta: WidgetMeta | null;
  crossDataset: CrossDatasetInputs | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Fetches SDMX data and structure metadata for all queries in parallel and returns
 * the current load/error/crossDataset state.
 *
 * `dataQueries` entries carry empty dimension-role values (`countryDimension`,
 * `indicatorDimensions`) because the backend does not yet supply this metadata; the
 * cross-dataset builders degrade gracefully to blank role columns rather than crashing.
 */
export function useSdmxData(): SdmxData {
  const snapshot = useBridgeSnapshot();
  const [crossDataset, setCrossDataset] = useState<CrossDatasetInputs | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useRef(0);

  const meta = useMemo(
    () => extractWidgetMeta(snapshot.toolResult),
    [snapshot.toolResult],
  );

  const fetchKey = useMemo(() => {
    if (!meta?.queries.length) return '';
    return JSON.stringify(meta.queries);
  }, [meta?.queries]);

  const refresh = useCallback(async () => {
    if (!meta?.queries.length) return;
    const token = ++fetchToken.current;
    setLoading(true);
    setError(null);
    try {
      const [rawResults, structureResults] = await Promise.all([
        Promise.all(
          meta.queries.map(async (q) => {
            const path = dataPath(q.sdmx);
            const raw = await bridge.callTool(meta.sdmxProxyToolName, {
              path,
            });
            return raw as DataMessage;
          }),
        ),
        Promise.allSettled(
          meta.queries.map(async (q) => {
            const path = structurePath(q.sdmx);
            const raw = (await bridge.callTool(meta.sdmxProxyToolName, {
              path,
            })) as { data?: StructuralData };
            return raw?.data;
          }),
        ),
      ]);
      if (token !== fetchToken.current) return;

      const dataMessagesMap = new Map<string, DataMessage | null>();
      const structuresMap = new Map<string, StructuralData | undefined>();
      const dataQueries: DataQuery[] = [];

      meta.queries.forEach((q, i) => {
        const urn = datasetUrn(q.sdmx);
        dataMessagesMap.set(urn, rawResults[i]);

        const structureResult = structureResults[i];
        if (structureResult.status === 'fulfilled') {
          structuresMap.set(urn, structureResult.value);
        } else {
          structuresMap.set(urn, undefined);
          console.error(
            `[widget][sdmx_proxy][structure] ✗ ${urn}`,
            structureResult.reason,
          );
        }

        dataQueries.push({
          urn,
          metadata: { countryDimension: '', indicatorDimensions: [] },
          filters: [],
        });
      });

      setCrossDataset({ structuresMap, dataMessagesMap, dataQueries });
    } catch (e) {
      console.error('[widget] callTool ✗', meta.sdmxProxyToolName, e);
      if (token !== fetchToken.current) return;
      setError((e as { message?: string }).message || String(e));
    } finally {
      if (token === fetchToken.current) setLoading(false);
    }
  }, [meta]);

  useEffect(() => {
    if (snapshot.phase === 'ready' && fetchKey) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.phase, fetchKey]);

  if (USE_DEV_MODE) {
    const devUrn = datasetUrn(mockMeta.queries[0].sdmx);
    return {
      snapshot: DEV_SNAPSHOT,
      meta: mockMeta,
      crossDataset: {
        structuresMap: new Map([[devUrn, mockStructuralData]]),
        dataMessagesMap: new Map([[devUrn, mockDataMessage]]),
        dataQueries: [
          {
            urn: devUrn,
            metadata: { countryDimension: '', indicatorDimensions: [] },
            filters: [],
          },
        ],
      },
      loading: false,
      error: null,
      refresh: () => {},
    };
  }

  return {
    snapshot,
    meta,
    crossDataset,
    loading:
      loading ||
      snapshot.phase === 'tool-pending' ||
      (!!meta?.queries.length &&
        !!snapshot.toolResult &&
        !crossDataset &&
        !error),
    error,
    refresh,
  };
}
