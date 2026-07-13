const DEFAULT_MAX_ITEMS = 3;
const DEFAULT_MAX_DEPTH = 6;

export interface TruncateOptions {
  /** Max array items / object keys kept at each level. @default 3 */
  maxItems?: number;
  /** Max recursion depth before deeper values are replaced with a placeholder. @default 6 */
  maxDepth?: number;
}

function truncate(
  value: unknown,
  maxItems: number,
  maxDepth: number,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (value === null || typeof value !== 'object') return value;

  if (seen.has(value)) return '[circular reference]';
  if (depth >= maxDepth) return '[max depth reached]';
  seen.add(value);

  if (Array.isArray(value)) {
    const kept = value
      .slice(0, maxItems)
      .map((item) => truncate(item, maxItems, maxDepth, depth + 1, seen));
    if (value.length > maxItems) {
      kept.push({ __truncated__: `${value.length - maxItems} more items` });
    }
    return kept;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const result: Record<string, unknown> = {};
  for (const [key, val] of entries.slice(0, maxItems)) {
    Object.defineProperty(result, key, {
      value: truncate(val, maxItems, maxDepth, depth + 1, seen),
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  if (entries.length > maxItems) {
    result.__truncated__ = `${entries.length - maxItems} more keys`;
  }
  return result;
}

/**
 * Reduces a JSON-shaped value to a small preview for debug logging: keeps the real
 * keys/values but caps each array/object to its first `maxItems` entries (appending a
 * `__truncated__` count marker for the rest) and caps recursion at `maxDepth`, so a
 * response with tens of thousands of observations logs as a handful of lines instead
 * of dumping the whole payload.
 *
 * `value` is expected to come from an untrusted HTTP response body, so object keys are
 * copied via `Object.defineProperty` rather than assignment — a field literally named
 * `__proto__` is preserved as ordinary data instead of reassigning the result's prototype.
 */
export function truncateForLog(
  value: unknown,
  options: TruncateOptions = {},
): unknown {
  const { maxItems = DEFAULT_MAX_ITEMS, maxDepth = DEFAULT_MAX_DEPTH } =
    options;
  return truncate(value, maxItems, maxDepth, 0, new WeakSet());
}
