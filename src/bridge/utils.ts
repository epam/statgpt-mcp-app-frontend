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
