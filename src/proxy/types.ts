// Wire types for the inner side of the mcpapp/proxy/* protocol.
// Source of truth: statgpt-mcp-apps-prototype/docs/007-nested-iframe/PROTOCOL.md
// and widget/src/proxyBridge.ts (the outer side we talk to).

export type DisplayMode = "inline" | "fullscreen" | "pip";

export interface ProxyCapabilities {
  /** Tool names the outer proxy will relay. Must contain the chart's
   *  fetch_tool_name for the explorer to load data. */
  tool_allowlist: string[];
  available_display_modes?: DisplayMode[];
  supports_update_model_context?: boolean;
  supports_send_follow_up_message?: boolean;
}

/** Params of the single `mcpapp/proxy/init` notification the outer sends
 *  (carrying the MessagePort on event.ports[0]). */
export interface ProxyInitParams {
  protocolVersion?: string;
  hostKind?: string;
  capabilities?: ProxyCapabilities;
  /** The latest chart structuredContent (metadata + SDMX query, no data). */
  initialToolResult?: unknown;
  /** Inner widget state the outer persisted on our behalf, if any. */
  initialInnerState?: unknown;
}

/** JSON-RPC frames exchanged over the MessagePort. */
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: number;
  method: string;
  params?: unknown;
}
export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
}
export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

/** Error carrying the proxy/host JSON-RPC error code (e.g. -32603 tool not
 *  in allowlist, -32099 superseded). */
export class ProxyError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "ProxyError";
    this.code = code;
  }
}

export type BridgePhase =
  | "connecting" // bootstrap posted, waiting for init + port
  | "ready" // init received, ready acked, ingress flowing
  | "error" // init never arrived, or fatal wire error
  | "torndown"; // outer sent ingress/teardown

/** Immutable snapshot the React layer subscribes to. A new object is minted
 *  on every change so it works with useSyncExternalStore. */
export interface BridgeSnapshot {
  phase: BridgePhase;
  hostKind?: string;
  capabilities?: ProxyCapabilities;
  superseded: boolean;
  /** Latest chart structuredContent — from init.initialToolResult, then
   *  replaced by each ingress/tool-result. Null until first payload. */
  toolResult: unknown | null;
  initialInnerState?: unknown;
  lastError?: string;
}
