import type { WidgetMeta, WidgetToolResult } from './types';

/**
 * Extracts widget metadata from an opaque MCP tool result, handling both direct
 * `WidgetToolResult` objects and the notification-params envelope shape
 * `{ content, structuredContent, isError }`.
 *
 * @param toolResult - The raw, untyped value returned by the MCP tool call.
 * @returns The parsed `WidgetMeta` if the result contains the expected fields, or `null` otherwise.
 */
export function extractWidgetMeta(toolResult: unknown): WidgetMeta | null {
  if (!toolResult || typeof toolResult !== 'object') return null;
  const r = toolResult as Record<string, unknown>;
  const candidate =
    !Array.isArray(r.queries) &&
    r.structuredContent != null &&
    typeof r.structuredContent === 'object'
      ? r.structuredContent
      : toolResult;
  const t = candidate as Partial<WidgetToolResult>;
  if (!Array.isArray(t.queries) || !t.tools?.sdmxProxy) return null;
  return {
    version: t.version === 1 || t.version === 2 ? t.version : undefined,
    title: typeof t.title === 'string' ? t.title : undefined,
    queries: t.queries,
    sdmxProxyToolName: t.tools.sdmxProxy,
    pythonCode: typeof t.pythonCode === 'string' ? t.pythonCode : undefined,
    status: typeof t.status === 'string' ? t.status : undefined,
    message: typeof t.message === 'string' ? t.message : undefined,
    candidateDatasets: Array.isArray(t.candidateDatasets)
      ? t.candidateDatasets
      : undefined,
    missingDimensions:
      t.missingDimensions && typeof t.missingDimensions === 'object'
        ? t.missingDimensions
        : undefined,
  };
}
