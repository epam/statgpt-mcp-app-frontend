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
  /** Asks the host to open a URL on its own privileged side (`ui/open-link`), sidestepping iframe-sandbox popup and mobile-WebView new-window-delegate questions entirely. */
  openLink(url: string): Promise<void>;
}

export interface BridgeSnapshot {
  phase: BridgePhase;
  hostContext?: McpUiHostContext;
  toolResult: unknown;
  /** True once a `tool-result` notification has been received for the current query, regardless of whether it carried `structuredContent`. Distinguishes "no result yet" from "received a result with nothing renderable" — both otherwise look like `toolResult == null`. */
  toolResultReceived: boolean;
  /** Text content accompanying the current `tool-result`, e.g. a model-facing summary. Present even when `structuredContent` is absent. */
  toolResultText?: string;
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
