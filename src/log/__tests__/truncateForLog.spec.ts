import { truncateForLog } from '../truncateForLog';

describe('truncateForLog', () => {
  it('returns primitives unchanged', () => {
    expect(truncateForLog('hello')).toBe('hello');
    expect(truncateForLog(42)).toBe(42);
    expect(truncateForLog(true)).toBe(true);
    expect(truncateForLog(null)).toBeNull();
    expect(truncateForLog(undefined)).toBeUndefined();
  });

  it('keeps arrays at or under the item limit unchanged', () => {
    expect(truncateForLog([1, 2], { maxItems: 3 })).toEqual([1, 2]);
  });

  it('truncates arrays over the item limit to the first N items plus a count marker', () => {
    const result = truncateForLog([1, 2, 3, 4, 5], {
      maxItems: 3,
    }) as unknown[];
    expect(result.slice(0, 3)).toEqual([1, 2, 3]);
    expect(result).toHaveLength(4);
    expect(result[3]).toEqual({ __truncated__: '2 more items' });
  });

  it('keeps objects at or under the key limit unchanged', () => {
    expect(truncateForLog({ a: 1, b: 2 }, { maxItems: 3 })).toEqual({
      a: 1,
      b: 2,
    });
  });

  it('truncates object keys over the limit to the first N keys plus a count marker', () => {
    const input = { a: 1, b: 2, c: 3, d: 4, e: 5 };
    const result = truncateForLog(input, { maxItems: 3 }) as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ a: 1, b: 2, c: 3, __truncated__: '2 more keys' });
  });

  it('recursively truncates nested arrays and objects using the same limits', () => {
    const input = { series: [1, 2, 3, 4, 5, 6] };
    const result = truncateForLog(input, { maxItems: 2 }) as {
      series: unknown[];
    };
    expect(result.series).toEqual([1, 2, { __truncated__: '4 more items' }]);
  });

  it('stops recursing at maxDepth and replaces deeper values with a placeholder', () => {
    const input = { a: { b: { c: { d: 'too deep' } } } };
    const result = truncateForLog(input, { maxDepth: 2 }) as Record<
      string,
      unknown
    >;
    expect(result).toEqual({ a: { b: '[max depth reached]' } });
  });

  it('guards against circular references instead of infinite-looping', () => {
    const input: Record<string, unknown> = { name: 'cyclic' };
    input.self = input;
    const result = truncateForLog(input) as Record<string, unknown>;
    expect(result.name).toBe('cyclic');
    expect(result.self).toBe('[circular reference]');
  });

  it('does not mutate the original input', () => {
    const original = [1, 2, 3, 4, 5];
    truncateForLog(original, { maxItems: 3 });
    expect(original).toHaveLength(5);
  });

  it('respects custom maxItems and maxDepth options', () => {
    const result = truncateForLog([1, 2, 3], { maxItems: 1 }) as unknown[];
    expect(result).toEqual([1, { __truncated__: '2 more items' }]);
  });

  it('treats a "__proto__" key as ordinary data instead of reassigning the prototype', () => {
    const input = JSON.parse(
      '{"__proto__":{"pwned":true},"normal":1}',
    ) as Record<string, unknown>;
    const result = truncateForLog(input) as Record<string, unknown>;

    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(Object.keys(result)).toContain('__proto__');
    expect(result.__proto__).toEqual({ pwned: true });
    expect(result.normal).toBe(1);
  });
});
