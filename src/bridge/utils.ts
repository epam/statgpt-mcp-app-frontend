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
