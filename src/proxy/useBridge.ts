import { useSyncExternalStore } from "react";
import { bridge } from "./innerBridge";
import type { BridgeSnapshot } from "./types";

/** Subscribe a component to the proxy bridge's snapshot. Re-renders on every
 *  phase / tool-result / supersession change. */
export function useBridgeSnapshot(): BridgeSnapshot {
  return useSyncExternalStore(bridge.subscribe, bridge.getSnapshot);
}
