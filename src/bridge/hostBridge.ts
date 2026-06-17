import { App } from "@modelcontextprotocol/ext-apps";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { BridgeError, type BridgeSnapshot } from "./types";

type Listener = () => void;

export interface HostBridge {
  start(): void;
  subscribe(listener: Listener): () => void;
  getSnapshot(): BridgeSnapshot;
  callTool(name: string, args: unknown): Promise<unknown>;
}

function unwrapStructured(result: unknown): unknown {
  if (!result || typeof result !== "object") return result;
  const r = result as Record<string, unknown>;
  const inner = ((r.result as Record<string, unknown>) ?? r);
  return inner.structuredContent ?? inner.structured_content ?? r.structuredContent ?? r.structured_content ?? inner;
}

function createHostBridge(): HostBridge {
  let sdkApp: App | null = null;
  let started = false;
  const listeners = new Set<Listener>();

  let snapshot: BridgeSnapshot = { phase: "connecting", toolResult: null };

  function emit() {
    listeners.forEach((l) => l());
  }

  function patch(next: Partial<BridgeSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emit();
  }

  function start() {
    if (started) return;
    started = true;

    sdkApp = new App({ name: "statgpt-data-widget", version: "0.1.0" }, {});

    sdkApp.ontoolresult = (params) => {
      patch({ toolResult: params.structuredContent ?? null });
    };

    sdkApp.ontoolcancelled = (params) => {
      patch({ phase: "error", lastError: `Tool cancelled${params.reason ? ": " + params.reason : ""}` });
    };

    sdkApp.onhostcontextchanged = (ctx: McpUiHostContext) => {
      patch({ hostContext: { ...snapshot.hostContext, ...ctx } });
    };

    sdkApp.onerror = (err: Error) => {
      patch({ phase: "error", lastError: err.message });
    };

    sdkApp.onteardown = () => {
      patch({ phase: "torndown" });
      return {};
    };

    sdkApp.connect().then(() => {
      patch({
        phase: "ready",
        hostContext: sdkApp!.getHostContext(),
      });
    }).catch((err: Error) => {
      patch({ phase: "error", lastError: err.message });
    });
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
      if (!sdkApp) throw new BridgeError("bridge not started");
      const result = await sdkApp.callServerTool({
        name,
        arguments: args as Record<string, unknown>,
      });
      return unwrapStructured(result);
    },
  };
}

export const bridge: HostBridge = createHostBridge();
