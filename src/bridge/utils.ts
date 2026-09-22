import { logger } from '../log/logger';
import { BridgeError } from './types';

/**
 * Unwraps a possibly `result`-nested tool-result envelope to the object that actually
 * carries the payload fields (`structuredContent`, `_meta`, etc.) — some hosts nest the
 * `CallToolResult` under an extra `result` layer, others send it flat.
 *
 * @param value - The raw tool-result object received from the host.
 * @returns The unwrapped object, or `undefined` when `value` isn't an object.
 */
function unwrapEnvelope(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const r = value as Record<string, unknown>;
  return r.result != null && typeof r.result === 'object'
    ? (r.result as Record<string, unknown>)
    : r;
}

/**
 * Normalizes the tool-call result envelope shapes returned by different MCP host
 * implementations — a spec-compliant nested `result.structuredContent` shape and a
 * flatter top-level shape — by extracting the innermost `structuredContent` value.
 *
 * @param result - The raw tool-call result object received from the host.
 * @returns The innermost `structuredContent` (or `structured_content`) value when a
 * known envelope shape is detected; otherwise the original `result` value unchanged.
 */
export function unwrapStructured(result: unknown): unknown {
  const inner = unwrapEnvelope(result);
  if (!inner) return result;
  const r = result as Record<string, unknown>;
  if ('structuredContent' in inner) return inner.structuredContent;
  if ('structured_content' in inner) return inner.structured_content;
  if ('structuredContent' in r) return r.structuredContent;
  if ('structured_content' in r) return r.structured_content;
  return inner;
}

/**
 * Extracts the Data Query MCP tool's widget-facing payload from a tool-result's `_meta`,
 * schema v3 onward: `result._meta["{namespace}/mcp-app"]`. The namespace is
 * channel-configurable (defaults to `statgpt.dialx.ai`), so this matches the one `_meta`
 * key ending in `/mcp-app` instead of assuming a fixed namespace string.
 *
 * @param result - The raw tool-result object received from the host.
 * @returns The matched payload, or `undefined` when `_meta` is absent or has no key
 * ending in "/mcp-app".
 */
export function extractMcpAppMeta(result: unknown): unknown {
  const inner = unwrapEnvelope(result);
  if (!inner) return undefined;
  const r = result as Record<string, unknown>;
  const meta = (inner._meta ?? r._meta) as Record<string, unknown> | undefined;
  if (!meta || typeof meta !== 'object') return undefined;
  const key = Object.keys(meta).find((k) => k.endsWith('/mcp-app'));
  return key ? meta[key] : undefined;
}

/**
 * Whether `value` is an object with at least one own key — used to tell a real
 * `_meta` mcp-app payload apart from a stray empty-object placeholder (`{}`), which a
 * malformed host/proxy could send in place of omitting the key or sending `null`.
 *
 * @param value - The value to check.
 */
function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && Object.keys(value).length > 0;
}

/**
 * A schema v3 `structuredContent` shape (`queries` present, no `tools`) reaching a
 * caller that expects the v1/v2 shape (which always carries `tools`) — the signature of
 * a v3 tool-result whose `_meta` payload was lost before it reached this bridge, as
 * opposed to a genuine v1/v2 response or a real no-data outcome.
 *
 * @param value - The value {@link resolveToolResult} is about to fall back to.
 */
function looksLikeStrippedV3Payload(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.queries) && v.tools == null;
}

/**
 * Resolves a `tool-result` notification's widget payload: the schema v3
 * `_meta["{namespace}/mcp-app"]` payload when present, falling back to the schema v1/v2
 * `structuredContent` shape otherwise. The fallback covers a host replaying an
 * already-recorded tool-result from before the backend moved to schema v3 for a given
 * channel — e.g. a host replaying the previous turn's tool-result verbatim on reload.
 *
 * @param params - The `tool-result` notification's params (a standard `CallToolResult`).
 */
export function resolveToolResult(params: {
  structuredContent?: unknown;
}): unknown {
  const mcpAppMeta = extractMcpAppMeta(params);
  if (isNonEmptyObject(mcpAppMeta)) return mcpAppMeta;

  const legacy = unwrapStructured(params.structuredContent) ?? null;
  if (looksLikeStrippedV3Payload(legacy)) {
    logger.warn(
      'bridge',
      'tool-result has queries but no `tools` and no `_meta` mcp-app payload — this ' +
        'looks like a schema v3 response whose `_meta` was lost in transit, not a ' +
        'genuine v1/v2 result or a real no-data outcome',
      legacy,
    );
  }
  return legacy;
}

function truncate(text: string, max = 200): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Finds the first `type: "text"` content block in an MCP `content` array and
 * returns its text, e.g. a model-facing summary accompanying a tool result.
 *
 * @param content - The `content` array from a tool-call result.
 * @returns The text of the first text block, or `undefined` if there is none.
 */
export function findTextBlock(content: unknown): { text: string } | undefined {
  if (!Array.isArray(content)) return undefined;
  return content.find(
    (block): block is { type: string; text: string } =>
      !!block &&
      typeof block === 'object' &&
      (block as Record<string, unknown>).type === 'text' &&
      typeof (block as Record<string, unknown>).text === 'string',
  );
}

/**
 * Extracts a proxied MCP tool call's actual payload from its `content` text block,
 * treating `structuredContent` as HTTP-metadata only (e.g. `{statusCode, contentType}`
 * for a passthrough tool) rather than as the payload itself.
 *
 * Unlike {@link unwrapStructured}, this never falls back to returning
 * `structuredContent` as the payload: a passthrough tool's `structuredContent` is not
 * shaped like the proxied data, so silently returning it would hand callers metadata
 * disguised as data instead of failing loudly.
 *
 * @param result - The raw tool-call result object received from the host.
 * @returns The JSON-parsed value of the result's text content block.
 * @throws {BridgeError} If the result has no text content, the call was flagged as
 * failed (`isError`, or an HTTP `statusCode` of 400 or above), or the text content is
 * not valid JSON.
 */
export function extractCallToolPayload(result: unknown): unknown {
  const inner = unwrapEnvelope(result);
  if (!inner) {
    throw new BridgeError('tool call returned an unexpected result shape');
  }

  const textBlock = findTextBlock(inner.content);
  if (!textBlock) {
    throw new BridgeError('tool call result did not include text content');
  }

  const structured = (inner.structuredContent ?? inner.structured_content) as
    | Record<string, unknown>
    | undefined;
  const statusCode =
    typeof structured?.statusCode === 'number'
      ? structured.statusCode
      : undefined;

  if (inner.isError || (statusCode != null && statusCode >= 400)) {
    throw new BridgeError(
      `tool call failed${statusCode != null ? ` with status ${statusCode}` : ''}: ${truncate(textBlock.text)}`,
    );
  }

  try {
    return JSON.parse(textBlock.text);
  } catch {
    throw new BridgeError('tool call result text content was not valid JSON');
  }
}
