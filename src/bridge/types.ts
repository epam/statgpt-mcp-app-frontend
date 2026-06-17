import type { McpUiHostContext } from "@modelcontextprotocol/ext-apps";

export type BridgePhase = "connecting" | "ready" | "error" | "torndown";

export interface HostBridge {
  start(): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): BridgeSnapshot;
  callTool(name: string, args: unknown): Promise<unknown>;
}

export interface BridgeSnapshot {
  phase: BridgePhase;
  hostContext?: McpUiHostContext;
  toolResult: unknown | null;
  lastError?: string;
}

export interface WidgetToolResult {
  version: 1;
  title?: string;
  queries: SdmxQuery[];
  tools: { sdmx_proxy: string };
}

export interface SdmxQuery {
  dataset_id?: string;
  sdmx: {
    context: string;
    agency_id: string;
    resource_id: string;
    version: string;
    key: string;
    params?: Record<string, string>;
  };
}

export class BridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BridgeError";
  }
}
