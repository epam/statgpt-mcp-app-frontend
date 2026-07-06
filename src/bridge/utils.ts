import { BridgeError } from './types';

/**
 * Normalizes the tool-call result envelope shapes returned by different MCP host
 * implementations (spec-compliant and ChatGPT) by extracting the innermost
 * `structuredContent` value.
 *
 * @param result - The raw tool-call result object received from the host.
 * @returns The innermost `structuredContent` (or `structured_content`) value when a
 * known envelope shape is detected; otherwise the original `result` value unchanged.
 */
export function unwrapStructured(result: unknown): unknown {
  if (!result || typeof result !== 'object') return result;
  const r = result as Record<string, unknown>;
  const inner =
    r.result != null && typeof r.result === 'object'
      ? (r.result as Record<string, unknown>)
      : r;
  if ('structuredContent' in inner) return inner.structuredContent;
  if ('structured_content' in inner) return inner.structured_content;
  if ('structuredContent' in r) return r.structuredContent;
  if ('structured_content' in r) return r.structured_content;
  return inner;
}

function truncate(text: string, max = 200): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function findTextBlock(content: unknown): { text: string } | undefined {
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
  if (!result || typeof result !== 'object') {
    throw new BridgeError('tool call returned an unexpected result shape');
  }
  const r = result as Record<string, unknown>;
  const inner = (
    r.result != null && typeof r.result === 'object'
      ? (r.result as Record<string, unknown>)
      : r
  ) as Record<string, unknown>;

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
