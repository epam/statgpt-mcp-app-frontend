import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bridge } from "../proxy/innerBridge";
import { useBridgeSnapshot } from "../proxy/useBridge";
import type { BridgeSnapshot } from "../proxy/types";
import {
  extractChartMeta,
  normalizeFetchResult,
  type ChartMeta,
  type ChartModel,
} from "../sdmx/parse";

const DEFAULT_FETCH_TOOL = "fetch_sdmx_data";

export interface SdmxData {
  snapshot: BridgeSnapshot;
  meta: ChartMeta | null;
  model: ChartModel | null;
  loading: boolean;
  error: string | null;
  /** Whether a fetch can be triggered (a query is available). */
  canFetch: boolean;
  /** Manually re-run the fetch (e.g. a Refresh button). */
  refresh: () => void;
}

// Owns the data lifecycle: subscribe to the proxy bridge, derive chart
// metadata from the latest tool-result, call fetch_sdmx_data through the
// proxy, and normalize the result into a chart model. Re-fetches whenever
// the query (or resolved tool name) changes.
export function useSdmxData(): SdmxData {
  const snapshot = useBridgeSnapshot();
  const meta = useMemo(() => extractChartMeta(snapshot.toolResult), [snapshot.toolResult]);

  const [model, setModel] = useState<ChartModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a stale async fetch overwriting a newer one.
  const fetchToken = useRef(0);

  const fetchToolName = meta?.fetchToolName || DEFAULT_FETCH_TOOL;
  const fetchKey = useMemo(
    () => (meta?.query ? `${fetchToolName}|${JSON.stringify(meta.query)}` : ""),
    [fetchToolName, meta?.query],
  );

  const refresh = useCallback(async () => {
    if (!meta?.query) return;
    const token = ++fetchToken.current;
    setLoading(true);
    setError(null);
    bridge.log("info", `callTool ${fetchToolName}`, meta.query);
    try {
      const raw = await bridge.callTool(fetchToolName, { query: meta.query });
      if (token !== fetchToken.current) return; // superseded by a newer fetch
      setModel(normalizeFetchResult(raw));
    } catch (e) {
      if (token !== fetchToken.current) return;
      const err = e as { code?: number; message?: string };
      setError((err.message || String(e)) + (err.code !== undefined ? ` (code ${err.code})` : ""));
      bridge.log("error", "callTool failed", err.message);
    } finally {
      if (token === fetchToken.current) setLoading(false);
    }
  }, [meta?.query, fetchToolName]);

  // Auto-fetch on first ready payload and on every query change.
  useEffect(() => {
    if (snapshot.phase === "ready" && fetchKey) void refresh();
    // fetchKey gates the run; refresh is stable per its inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.phase, fetchKey]);

  return {
    snapshot,
    meta,
    model,
    loading,
    error,
    canFetch: !!meta?.query,
    refresh: () => void refresh(),
  };
}
