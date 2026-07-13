import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';

export type BridgePhase =
  | 'connecting'
  | 'tool-pending'
  | 'ready'
  | 'error'
  | 'torndown';

export type HostKind = 'claude' | 'chatgpt' | 'generic';

export interface HostBridge {
  start(): void;
  subscribe(listener: () => void): () => void;
  getSnapshot(): BridgeSnapshot;
  callTool(name: string, args: unknown): Promise<unknown>;
}

export interface BridgeSnapshot {
  phase: BridgePhase;
  hostKind?: HostKind;
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
