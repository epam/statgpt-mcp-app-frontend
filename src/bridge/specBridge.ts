import { App } from "@modelcontextprotocol/ext-apps";
import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { BridgeError, type BridgeSnapshot, type HostBridge } from "./types";
import { unwrapStructured } from "./utils";

type Listener = () => void;

export function createSpecBridge(): HostBridge {
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

    sdkApp = new App({ name: "statgpt-data-widget", version: "0.1.0" }, {}, { autoResize: true });

    sdkApp.ontoolresult = (params) => {
      patch({ toolResult: unwrapStructured(params.structuredContent) ?? null });
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
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return snapshot;
    },
    async callTool(name: string, args: unknown) {
      if (!sdkApp) throw new BridgeError("bridge not started");
      const result = await sdkApp.callServerTool({
        name,
        arguments: args as Record<string, unknown>,
      });
      return unwrapStructured(result);
    },
  };
}
