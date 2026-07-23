import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import type { CrossDatasetInputs } from '../types/sdmx';
import { bridge } from '../bridge';
import { useBridgeSnapshot } from '../bridge/useBridge';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { BridgeSnapshot, WidgetMeta } from '../bridge/types';
import { extractWidgetMeta } from '../bridge/parseToolResult';
import { dataPath, structurePath } from '../sdmx/buildPaths';
import { logger } from '../log/logger';
import { truncateForLog } from '../log/truncateForLog';
import {
  mockMeta,
  mockStructuralData,
  mockDataMessage,
} from '../mocks/sdmxData';
import {
  MOCK_HOST_CONTEXT_DARK,
  MOCK_HOST_CONTEXT_LIGHT,
} from '../mocks/hostContext';

/**
 * True when running the widget directly in a browser tab (no host iframe
 * parent) during local development — the bridge never completes its
 * handshake in this mode, so this and `useDatasetsMetadata` both substitute
 * mock/skip real tool calls instead of hanging or erroring against a host
 * that isn't there.
 */
export const USE_DEV_MODE =
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
  DEV_THEME === 'none'
    ? undefined
    : DEV_THEME === 'dark'
      ? MOCK_HOST_CONTEXT_DARK
      : MOCK_HOST_CONTEXT_LIGHT;

const DEV_SNAPSHOT: BridgeSnapshot = {
  phase: 'ready',
  toolResult: null,
  hostContext: DEV_BASE_CONTEXT
    ? {
        ...DEV_BASE_CONTEXT,
        displayMode: DEV_DISPLAY_MODE as McpUiHostContext['displayMode'],
      }
    : undefined,
};

export interface SdmxData {
  snapshot: BridgeSnapshot;
  meta: WidgetMeta | null;
  crossDataset: CrossDatasetInputs | null;
  loading: boolean;
  error: string | null;
  emptyResult: boolean;
  refresh: () => void;
}

/**
 * Fetches SDMX data and structure metadata for all enabled queries in parallel and
 * returns the current load/error/crossDataset state.
 */
export function useSdmxData(): SdmxData {
  const snapshot = useBridgeSnapshot();
  const [crossDataset, setCrossDataset] = useState<CrossDatasetInputs | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useRef(0);

  const meta = useMemo(() => {
    const extracted = extractWidgetMeta(snapshot.toolResult);
    if (!extracted && snapshot.toolResult) {
      logger.warn(
        'widget-empty',
        'tool-result missing expected fields (queries/tools.sdmxProxy) — widget will show an empty state',
        snapshot.toolResult,
      );
    }
    return extracted;
  }, [snapshot.toolResult]);

  const activeQueries = useMemo(
    () => meta?.queries.filter((q) => !q.disabled) ?? [],
    [meta],
  );

  useEffect(() => {
    if (!meta) return;
    if (meta.queries.length === 0) {
      logger.warn(
        'widget-empty',
        'tool-result contained an empty queries array — widget will show an empty state',
        snapshot.toolResult,
      );
    } else if (activeQueries.length === 0) {
      logger.warn(
        'widget-empty',
        'all queries in tool-result are disabled — widget will show an empty state',
        meta.queries,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, activeQueries.length]);

  // Clear stale data from a previous query as soon as a new one starts, so
  // AppContent doesn't keep showing the old grid instead of the loader.
  useEffect(() => {
    if (snapshot.phase === 'tool-pending') setCrossDataset(null);
  }, [snapshot.phase]);

  const fetchKey = useMemo(() => {
    if (!activeQueries.length) return '';
    return JSON.stringify(activeQueries);
  }, [activeQueries]);

  const refresh = useCallback(async () => {
    if (!meta || !activeQueries.length) return;
    const token = ++fetchToken.current;
    setLoading(true);
    setError(null);
    try {
      const [dataResults, structureResults] = await Promise.all([
        Promise.allSettled(
          activeQueries.map(async (q) => {
            const path = dataPath(q);
            logger.debug('sdmx_proxy', 'request', {
              kind: 'data',
              urn: q.urn,
              path,
            });
            const startedAt = performance.now();
            const raw = (await bridge.callTool(meta.sdmxProxyToolName, {
              path,
            })) as DataMessage;
            logger.debug('sdmx_proxy', 'response', {
              kind: 'data',
              urn: q.urn,
              durationMs: Math.round(performance.now() - startedAt),
              response: truncateForLog(raw),
            });
            return raw;
          }),
        ),
        Promise.allSettled(
          activeQueries.map(async (q) => {
            const path = structurePath(q);
            logger.debug('sdmx_proxy', 'request', {
              kind: 'structure',
              urn: q.urn,
              path,
            });
            const startedAt = performance.now();
            const raw = (await bridge.callTool(meta.sdmxProxyToolName, {
              path,
            })) as { data?: StructuralData };
            logger.debug('sdmx_proxy', 'response', {
              kind: 'structure',
              urn: q.urn,
              durationMs: Math.round(performance.now() - startedAt),
              response: truncateForLog(raw?.data),
            });
            return raw?.data;
          }),
        ),
      ]);
      if (token !== fetchToken.current) return;

      const succeededQueries: typeof activeQueries = [];
      const dataMessagesMap = new Map<string, DataMessage | null>();
      const structuresMap = new Map<string, StructuralData | undefined>();

      activeQueries.forEach((q, i) => {
        const dataResult = dataResults[i];
        if (dataResult.status === 'rejected') {
          logger.warn(
            'widget-empty',
            `data fetch failed for dataset — excluded from view: ${q.urn}`,
            { reason: dataResult.reason },
          );
          return;
        }

        succeededQueries.push(q);
        dataMessagesMap.set(q.urn, dataResult.value);

        const structureResult = structureResults[i];
        if (structureResult.status === 'fulfilled') {
          structuresMap.set(q.urn, structureResult.value);
        } else {
          structuresMap.set(q.urn, undefined);
          logger.error('sdmx_proxy', `structure fetch failed: ${q.urn}`, {
            reason: structureResult.reason,
          });
        }
      });

      const failedCount = activeQueries.length - succeededQueries.length;

      if (succeededQueries.length === 0) {
        setCrossDataset(null);
        const firstRejected = dataResults.find(
          (r): r is PromiseRejectedResult => r.status === 'rejected',
        );
        const reason = firstRejected?.reason as { message?: string };
        setError(reason?.message || String(firstRejected?.reason));
      } else {
        setCrossDataset({
          structuresMap,
          dataMessagesMap,
          dataQueries: succeededQueries,
        });
        setError(null);
        if (failedCount > 0) {
          logger.warn(
            'widget-empty',
            `${failedCount} of ${activeQueries.length} datasets failed to load — rendering partial results with no user-facing indicator`,
          );
        }
      }
    } catch (e) {
      logger.error(
        'sdmx_proxy',
        `callTool failed: ${meta.sdmxProxyToolName}`,
        e,
      );
      if (token !== fetchToken.current) return;
      setError((e as { message?: string }).message || String(e));
    } finally {
      if (token === fetchToken.current) setLoading(false);
    }
  }, [meta, activeQueries]);

  useEffect(() => {
    if (snapshot.phase === 'ready' && fetchKey) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.phase, fetchKey]);

  if (USE_DEV_MODE) {
    const devQuery = mockMeta.queries[0];
    return {
      snapshot: DEV_SNAPSHOT,
      meta: mockMeta,
      crossDataset: {
        structuresMap: new Map([[devQuery.urn, mockStructuralData]]),
        dataMessagesMap: new Map([[devQuery.urn, mockDataMessage]]),
        dataQueries: [devQuery],
      },
      loading: false,
      error: null,
      emptyResult: false,
      refresh: () => {},
    };
  }

  const awaitingFirstQuery =
    snapshot.phase === 'ready' && snapshot.toolResult == null;

  return {
    snapshot,
    meta,
    crossDataset,
    loading:
      loading ||
      snapshot.phase === 'tool-pending' ||
      awaitingFirstQuery ||
      (!!activeQueries.length &&
        !!snapshot.toolResult &&
        !crossDataset &&
        !error),
    error,
    emptyResult: !!snapshot.toolResult && activeQueries.length === 0,
    refresh,
  };
}
