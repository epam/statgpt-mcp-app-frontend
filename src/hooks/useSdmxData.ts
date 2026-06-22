import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { bridge } from "../bridge";
import { useBridgeSnapshot } from "../bridge/useBridge";
import type { BridgeSnapshot } from "../bridge/types";
import {
  extractWidgetMeta,
  normalizeSdmxDataResponse,
  type ChartModel,
  type WidgetMeta,
} from "../sdmx/parse";
import { dataPath } from "../sdmx/buildPaths";
import { mockMeta, mockModel } from "../mocks/sdmxData";
import { MOCK_HOST_CONTEXT_DARK, MOCK_HOST_CONTEXT_LIGHT } from "../mocks/hostContext";

const USE_DEV_MODE =
  import.meta.env.DEV && typeof window !== "undefined" && window.parent === window;

const DEV_THEME =
  typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("theme") ?? "light"
    : "light";

const DEV_SNAPSHOT: BridgeSnapshot = {
  phase: "ready",
  toolResult: null,
  hostContext: DEV_THEME === "dark" ? MOCK_HOST_CONTEXT_DARK : MOCK_HOST_CONTEXT_LIGHT,
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

export function useSdmxData(): SdmxData {
  const snapshot = useBridgeSnapshot();
  const [model, setModel] = useState<ChartModel | null>(USE_DEV_MODE ? mockModel : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToken = useRef(0);

  const meta = useMemo(
    () => (USE_DEV_MODE ? mockMeta : extractWidgetMeta(snapshot.toolResult)),
    // USE_DEV_MODE is constant — snapshot.toolResult is the only reactive dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [snapshot.toolResult],
  );

  const fetchKey = useMemo(() => {
    if (USE_DEV_MODE || !meta?.queries.length) return "";
    return JSON.stringify(meta.queries);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.queries]);

  const refresh = useCallback(async () => {
    if (USE_DEV_MODE || !meta?.queries.length) return;
    // TODO: v1 fetches only the first query; multi-query support is deferred
    const q = meta.queries[0];
    const path = dataPath(q.sdmx);
    const token = ++fetchToken.current;
    setLoading(true);
    setError(null);
    try {
      const raw = await bridge.callTool(meta.sdmxProxyToolName, { path });
      if (token !== fetchToken.current) return;
      setModel(normalizeSdmxDataResponse(raw));
    } catch (e) {
      if (token !== fetchToken.current) return;
      const err = e as { message?: string };
      setError(err.message || String(e));
    } finally {
      if (token === fetchToken.current) setLoading(false);
    }
  }, [meta]);

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
    canFetch: !!meta?.queries.length,
    refresh: () => void refresh(),
  };
}
