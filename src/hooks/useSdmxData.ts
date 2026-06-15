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
import { mockMeta, mockModel } from "../mocks/sdmxData";

const DEFAULT_FETCH_TOOL = "fetch_sdmx_data";

// Computed once at module load — stable for the entire app lifetime.
const USE_DEV_MODE =
  import.meta.env.DEV && typeof window !== "undefined" && window.parent === window;

const DEV_SNAPSHOT: BridgeSnapshot = { phase: "ready", superseded: false, toolResult: null };

export interface SdmxData {
  snapshot: BridgeSnapshot;
  meta: ChartMeta | null;
  model: ChartModel | null;
  loading: boolean;
  error: string | null;
  canFetch: boolean;
  refresh: () => void;
}

export function useSdmxData(): SdmxData {
  const snapshot = useBridgeSnapshot();
  const [model, setModel] = useState<ChartModel | null>(USE_DEV_MODE ? mockModel : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useRef(0);

  const meta = useMemo(
    () => (USE_DEV_MODE ? mockMeta : extractChartMeta(snapshot.toolResult)),
    // USE_DEV_MODE is constant — snapshot.toolResult is the only reactive dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot.toolResult],
  );

  const fetchToolName = meta?.fetchToolName || DEFAULT_FETCH_TOOL;
  const fetchKey = useMemo(
    () =>
      USE_DEV_MODE || !meta?.query ? "" : `${fetchToolName}|${JSON.stringify(meta.query)}`,
    [fetchToolName, meta?.query],
  );

  const refresh = useCallback(async () => {
    if (USE_DEV_MODE || !meta?.query) return;
    const token = ++fetchToken.current;
    setLoading(true);
    setError(null);
    bridge.log("info", `callTool ${fetchToolName}`, meta.query);
    try {
      const raw = await bridge.callTool(fetchToolName, { query: meta.query });
      if (token !== fetchToken.current) return;
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

  useEffect(() => {
    if (USE_DEV_MODE) return;
    if (snapshot.phase === "ready" && fetchKey) void refresh();
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
