// ============================================================================
// Inner-side proxy client — the inner half of the docs/007-nested-iframe
// wire contract. TypeScript port of the reference implementation in
// <private-repo>/proxy/inner_widget/index.html, restructured as
// a subscribable store so React can render off it via useSyncExternalStore.
//
// Handshake (PROTOCOL.md §4):
//   1. post `mcpapp-proxy-bootstrap` to window.parent ("*" target origin —
//      the outer validates event.source + event.origin before replying).
//   2. outer replies with one `mcpapp/proxy/init` notification carrying a
//      MessagePort on event.ports[0]; adopt it, stop reading window messages.
//   3. ack with `mcpapp/proxy/ready`; from then on the outer forwards every
//      host ingress event as `mcpapp/proxy/ingress/*` notifications.
//   4. outbound agent calls are JSON-RPC requests with an `id`; responses
//      match by id. The outer enforces the tool allowlist and supersession.
// ============================================================================

import {
  ProxyError,
  type BridgeSnapshot,
  type DisplayMode,
  type JsonRpcResponse,
  type ProxyInitParams,
} from "./types";

const BOOTSTRAP_MARKER = "mcpapp-proxy-bootstrap";
const INIT_KIND = "mcpapp-proxy";
const INIT_METHOD = "mcpapp/proxy/init";
const PROTOCOL_VERSION = "0.1.0";
const REQUEST_TIMEOUT_MS = 30000;
const INIT_WATCHDOG_MS = 8000;

type Listener = () => void;
type PendingEntry = { resolve: (v: unknown) => void; reject: (e: Error) => void };

export interface InnerBridge {
  /** Begin the handshake. Idempotent; safe to call once at startup. */
  start(): void;
  subscribe(listener: Listener): () => void;
  getSnapshot(): BridgeSnapshot;
  /** Relay a tool call through the outer. Resolves to the unwrapped
   *  structuredContent payload. Rejects with a ProxyError (carrying the
   *  JSON-RPC code) on allowlist denial / supersession / host error. */
  callTool(name: string, args: unknown): Promise<unknown>;
  updateModelContext(content: unknown[]): Promise<unknown>;
  sendFollowUpMessage(prompt: string): Promise<unknown>;
  requestDisplayMode(mode: DisplayMode): Promise<unknown>;
  /** Persist inner widget state through the outer's widget-state slot. */
  setWidgetState(state: unknown): void;
  /** Surface a log line in the outer's eventLog (debug across the boundary). */
  log(level: "debug" | "info" | "warn" | "error", message: string, data?: unknown): void;
}

function createInnerBridge(): InnerBridge {
  let port: MessagePort | null = null;
  let started = false;
  let initialized = false;

  const listeners = new Set<Listener>();
  const pending = new Map<number, PendingEntry>();
  let nextRequestId = 1;

  // Mutable backing state; `snapshot` is the frozen view handed to React.
  let snapshot: BridgeSnapshot = {
    phase: "connecting",
    superseded: false,
    toolResult: null,
  };

  function emit() {
    listeners.forEach((l) => l());
  }

  function patch(next: Partial<BridgeSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emit();
  }

  function unwrapStructured(result: unknown): unknown {
    // Mirror hostBridge.unwrapStructured: a tool result may arrive as the
    // raw payload or wrapped under structuredContent / structured_content.
    if (result && typeof result === "object") {
      const r = result as Record<string, unknown>;
      if ("structuredContent" in r) return r.structuredContent;
      if ("structured_content" in r) return r.structured_content;
    }
    return result;
  }

  function send(method: string, params: unknown, id?: number) {
    if (!port) return;
    const frame =
      id === undefined
        ? { jsonrpc: "2.0", method, params }
        : { jsonrpc: "2.0", method, params, id };
    port.postMessage(frame);
  }

  function request(method: string, params: unknown): Promise<unknown> {
    return new Promise((resolve, reject) => {
      if (!port) {
        reject(new ProxyError("proxy port not open"));
        return;
      }
      if (snapshot.superseded) {
        reject(new ProxyError("outer is superseded; proxy refuses", -32099));
        return;
      }
      const id = nextRequestId++;
      pending.set(id, { resolve, reject });
      send(method, params, id);
      // Local safety timeout — the outer also enforces, but a stuck proxy
      // must not leave a Promise pending forever.
      window.setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id);
          reject(new ProxyError(`proxy request timeout (${method})`));
        }
      }, REQUEST_TIMEOUT_MS);
    });
  }

  function handleResponse(msg: JsonRpcResponse) {
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    if (msg.error) {
      entry.reject(new ProxyError(msg.error.message || "proxy error", msg.error.code));
    } else {
      entry.resolve(msg.result);
    }
  }

  function handleNotification(method: string, params: unknown) {
    switch (method) {
      case "mcpapp/proxy/ingress/tool-result":
        patch({ toolResult: params ?? null });
        return;
      case "mcpapp/proxy/ingress/set-globals":
      case "mcpapp/proxy/ingress/host-context-changed":
        // Not consumed by the SDMX explorer yet; ignored deliberately.
        return;
      case "mcpapp/proxy/ingress/superseded":
        patch({ superseded: !!(params as { superseded?: boolean })?.superseded });
        return;
      case "mcpapp/proxy/ingress/teardown":
        teardown();
        return;
      default:
        // Unknown notification — drop (no id to error back on).
        return;
    }
  }

  function handlePortMessage(data: unknown) {
    if (!data || typeof data !== "object") return;
    const m = data as Partial<JsonRpcResponse> & { method?: string; params?: unknown };
    // Response (has id, matches a pending request) vs notification (method only).
    if (typeof m.id === "number" && pending.has(m.id)) {
      handleResponse(m as JsonRpcResponse);
      return;
    }
    if (typeof m.method === "string") {
      handleNotification(m.method, m.params);
    }
  }

  function handleInit(params: ProxyInitParams) {
    if (initialized) return;
    initialized = true;
    patch({
      phase: "ready",
      hostKind: params.hostKind,
      capabilities: params.capabilities,
      toolResult: params.initialToolResult ?? snapshot.toolResult,
      initialInnerState: params.initialInnerState,
    });
    // Ack — the outer starts forwarding ingress only after this.
    send("mcpapp/proxy/ready", { widgetVersion: "0.1.0" });
  }

  function onWindowMessage(e: MessageEvent) {
    const data = e.data as { kind?: string; method?: string; params?: ProxyInitParams } | null;
    if (!data || typeof data !== "object") return;
    if (data.kind !== INIT_KIND || data.method !== INIT_METHOD) return;
    if (!e.ports || !e.ports[0]) return;
    port = e.ports[0];
    port.onmessage = (ev) => handlePortMessage(ev.data);
    try {
      port.start();
    } catch {
      /* no-op */
    }
    window.removeEventListener("message", onWindowMessage);
    handleInit(data.params || {});
  }

  function teardown() {
    if (port) {
      try {
        port.close();
      } catch {
        /* no-op */
      }
      port = null;
    }
    pending.forEach((e) => e.reject(new ProxyError("bridge torn down")));
    pending.clear();
    patch({ phase: "torndown" });
  }

  function start() {
    if (started) return;
    started = true;

    // Listener attached BEFORE the bootstrap post (PROTOCOL.md §4 step 4).
    window.addEventListener("message", onWindowMessage);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ kind: BOOTSTRAP_MARKER, protocolVersion: PROTOCOL_VERSION }, "*");
    } else {
      // Opened standalone (no host) — render a "waiting for host" state.
      patch({ phase: "error", lastError: "no parent window (opened standalone)" });
      return;
    }

    window.setTimeout(() => {
      if (!initialized) {
        patch({
          phase: "error",
          lastError:
            "outer never delivered the proxy port within " +
            INIT_WATCHDOG_MS +
            "ms (CSP frame-src blocked, wrong inner origin, or proxy disabled)",
        });
      }
    }, INIT_WATCHDOG_MS);
  }

  return {
    start,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    async callTool(name, args) {
      const result = await request("mcpapp/proxy/tools/call", { name, arguments: args });
      return unwrapStructured(result);
    },
    updateModelContext(content) {
      return request("mcpapp/proxy/ui/update-model-context", { content });
    },
    sendFollowUpMessage(prompt) {
      return request("mcpapp/proxy/ui/message", { prompt });
    },
    requestDisplayMode(mode) {
      return request("mcpapp/proxy/ui/request-display-mode", { mode });
    },
    setWidgetState(state) {
      send("mcpapp/proxy/set-widget-state", { state });
    },
    log(level, message, data) {
      send("mcpapp/proxy/log", { level, message, data });
    },
  };
}

/** Singleton — there is exactly one host parent per document. */
export const bridge: InnerBridge = createInnerBridge();
