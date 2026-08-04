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

/** Tags which `query_data` pipeline branch produced a tool result (structuredContent schema v2). */
export const DataQueryStatus = {
  DataAvailable: 'data_available',
  ExecutedNoData: 'executed_no_data',
  Failed: 'failed',
  NotExecuted: 'not_executed',
  DatasetSelectionRequired: 'dataset_selection_required',
  InvalidTimePeriod: 'invalid_time_period',
  MissingDimensions: 'missing_dimensions',
  NoData: 'no_data',
} as const;
export type DataQueryStatus =
  (typeof DataQueryStatus)[keyof typeof DataQueryStatus];

/** A dataset the user/agent can choose from to disambiguate a query (`dataset_selection_required`). */
export interface DataSetChoice {
  id: string;
  name: string;
  description?: string;
  isOfficial: boolean;
}

/** An available value of a missing dimension the user can pick from. */
export interface DimensionValueInfo {
  id: string;
  name: string;
  description?: string;
}

/** A required dimension not yet specified, with the values available to choose from. */
export interface MissingDimensionInfo {
  dimensionId: string;
  name: string;
  availableValues: DimensionValueInfo[];
}

/** Describes why a query is incomplete: which dimensions of which dataset still need a value. */
export interface MissingDimensionsInfo {
  datasetId: string;
  dimensions: MissingDimensionInfo[];
}

export interface WidgetToolResult {
  version: 1 | 2;
  title?: string;
  queries: DataQuery[];
  tools: { sdmxProxy: string };
  pythonCode?: string;
  status?: DataQueryStatus;
  message?: string;
  candidateDatasets?: DataSetChoice[];
  missingDimensions?: MissingDimensionsInfo;
}

export interface WidgetMeta {
  version?: 1 | 2;
  title?: string;
  queries: DataQuery[];
  sdmxProxyToolName: string;
  pythonCode?: string;
  status?: DataQueryStatus;
  message?: string;
  candidateDatasets?: DataSetChoice[];
  missingDimensions?: MissingDimensionsInfo;
}

export class BridgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BridgeError';
  }
}
