import type {
  McpUiDisplayMode,
  McpUiHostContext,
} from '@modelcontextprotocol/ext-apps';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';

export type BridgePhase =
  | 'connecting'
  | 'tool-pending'
  | 'ready'
  | 'error'
  | 'torndown';

export interface HostBridge {
  start(): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): BridgeSnapshot;
  /** For passthrough tools whose actual payload is a JSON text content block (e.g. `sdmx_proxy`). */
  callTool(name: string, args: unknown): Promise<unknown>;
  /** For tools whose payload IS the `structuredContent` and carry no text content block. */
  callToolStructured(name: string, args: unknown): Promise<unknown>;
  requestDisplayMode(mode: McpUiDisplayMode): Promise<void>;
}

export interface BridgeSnapshot {
  phase: BridgePhase;
  hostContext?: McpUiHostContext;
  toolResult: unknown;
  lastError?: string;
}

export interface WidgetToolResult {
  version: 1;
  title?: string;
  queries: DataQuery[];
  tools: { sdmxProxy: string };
  pythonCode?: string;
}

export interface WidgetMeta {
  title?: string;
  queries: DataQuery[];
  sdmxProxyToolName: string;
  pythonCode?: string;
}

export class BridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BridgeError';
  }
}
