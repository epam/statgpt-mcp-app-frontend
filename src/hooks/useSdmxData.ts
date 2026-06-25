import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { bridge } from '../bridge';
import { useBridgeSnapshot } from '../bridge/useBridge';
import type { BridgeSnapshot, WidgetMeta } from '../bridge/types';
import { extractWidgetMeta } from '../bridge/parseToolResult';
import {
  normalizeSdmxDataResponse,
  mergeChartModels,
  type ChartModel,
} from '../sdmx/parse';
import { dataPath } from '../sdmx/buildPaths';
import { mockMeta, mockModel } from '../mocks/sdmxData';
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

const DEV_SNAPSHOT: BridgeSnapshot = {
  phase: 'ready',
  toolResult: null,
  hostContext:
    DEV_THEME === 'dark' ? MOCK_HOST_CONTEXT_DARK : MOCK_HOST_CONTEXT_LIGHT,
};

export interface SdmxData {
  snapshot: BridgeSnapshot;
  meta: WidgetMeta | null;
  model: ChartModel | null;
  loading: boolean;
  error: string | null;
  canFetch: boolean;
  refresh: () => void;
}

/**
 * Reads the bridge snapshot, extracts widget metadata, fetches SDMX data via the MCP tool proxy
 * for all queries in parallel, merges the results, and returns the current load/error/model state.
 */
export function useSdmxData(): SdmxData {
  const snapshot = useBridgeSnapshot();
  const [model, setModel] = useState<ChartModel | null>(
    USE_DEV_MODE ? mockModel : null,
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
      const rawResults = await Promise.all(
        meta.queries.map((q) =>
          bridge.callTool(meta.sdmxProxyToolName, { path: dataPath(q.sdmx) }),
        ),
      );
      if (token !== fetchToken.current) return;
      setModel(mergeChartModels(rawResults.map(normalizeSdmxDataResponse)));
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
    // refresh is stable per meta; fetchKey already captures query identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.phase, fetchKey]);

  if (USE_DEV_MODE) {
    return {
      snapshot: DEV_SNAPSHOT,
      meta: mockMeta,
      model,
      loading: false,
      error: null,
      canFetch: false,
      refresh: () => {},
    };
  }

  const canFetch = !!meta?.queries.length;
  return {
    snapshot,
    meta,
    model,
    loading:
      loading ||
      snapshot.phase === 'tool-pending' ||
      (canFetch && !!snapshot.toolResult && !model && !error),
    error,
    canFetch,
    refresh: () => void refresh(),
  };
}
