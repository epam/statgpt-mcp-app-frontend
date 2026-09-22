import {
  extractCallToolPayload,
  extractMcpAppMeta,
  resolveToolResult,
  unwrapStructured,
} from '../utils';
import { BridgeError } from '../types';

describe('unwrapStructured', () => {
  it('extracts structuredContent from a root envelope', () => {
    const payload = { id: 1 };
    expect(unwrapStructured({ structuredContent: payload })).toBe(payload);
  });

  it('extracts structured_content from a root envelope', () => {
    const payload = { id: 2 };
    expect(unwrapStructured({ structured_content: payload })).toBe(payload);
  });

  it('extracts structuredContent nested under result', () => {
    const payload = { id: 3 };
    expect(unwrapStructured({ result: { structuredContent: payload } })).toBe(
      payload,
    );
  });

  it('extracts structured_content nested under result', () => {
    const payload = { id: 4 };
    expect(unwrapStructured({ result: { structured_content: payload } })).toBe(
      payload,
    );
  });

  it('returns the input unchanged when no known envelope key is present', () => {
    const input = { foo: 'bar', baz: 42 };
    expect(unwrapStructured(input)).toBe(input);
  });

  it('returns an empty object unchanged', () => {
    const input = {};
    expect(unwrapStructured(input)).toBe(input);
  });

  it('returns null unchanged', () => {
    expect(unwrapStructured(null)).toBeNull();
  });

  it('returns a number unchanged', () => {
    expect(unwrapStructured(42)).toBe(42);
  });

  it('returns a string unchanged', () => {
    expect(unwrapStructured('hello')).toBe('hello');
  });
});

describe('extractMcpAppMeta', () => {
  it('extracts the mcp-app payload from a root-level `_meta`', () => {
    const payload = { status: 'data_available' };
    expect(
      extractMcpAppMeta({ _meta: { 'statgpt.dialx.ai/mcp-app': payload } }),
    ).toBe(payload);
  });

  it('extracts the mcp-app payload from a `result`-nested `_meta`', () => {
    const payload = { status: 'data_available' };
    expect(
      extractMcpAppMeta({
        result: { _meta: { 'statgpt.dialx.ai/mcp-app': payload } },
      }),
    ).toBe(payload);
  });

  it('matches the `/mcp-app` suffix regardless of the configured namespace', () => {
    const payload = { status: 'no_data' };
    expect(
      extractMcpAppMeta({ _meta: { 'acme.example.org/mcp-app': payload } }),
    ).toBe(payload);
  });

  it('does not match a `client` payload under a different suffix', () => {
    const clientPayload = { status: 'data_available' };
    expect(
      extractMcpAppMeta({
        _meta: { 'statgpt.dialx.ai/client': clientPayload },
      }),
    ).toBeUndefined();
  });

  it('returns undefined when `_meta` is absent', () => {
    expect(extractMcpAppMeta({ structuredContent: {} })).toBeUndefined();
  });

  it('returns undefined when `_meta` has no `*/mcp-app` key', () => {
    expect(extractMcpAppMeta({ _meta: { foo: 'bar' } })).toBeUndefined();
  });

  it('returns undefined for non-object input', () => {
    expect(extractMcpAppMeta(null)).toBeUndefined();
    expect(extractMcpAppMeta('hello')).toBeUndefined();
  });
});

describe('resolveToolResult', () => {
  it('reads the schema v3 mcp-app payload from `_meta` when present', () => {
    const mcpAppPayload = { status: 'data_available', version: 3 };
    const params = {
      structuredContent: { queries: [] },
      _meta: { 'statgpt.dialx.ai/mcp-app': mcpAppPayload },
    };
    expect(resolveToolResult(params)).toBe(mcpAppPayload);
  });

  it('falls back to a schema v1/v2 `structuredContent` when `_meta` has no mcp-app key', () => {
    const legacyPayload = {
      version: 2,
      status: 'data_available',
      queries: [],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };
    const params = { structuredContent: legacyPayload };
    expect(resolveToolResult(params)).toBe(legacyPayload);
  });

  it('falls back to `structuredContent` when `_meta` is absent entirely', () => {
    const legacyPayload = {
      version: 1,
      queries: [],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };
    const params = { structuredContent: legacyPayload };
    expect(resolveToolResult(params)).toBe(legacyPayload);
  });

  it('prefers the `_meta` mcp-app payload over `structuredContent` when both are present', () => {
    const mcpAppPayload = { status: 'data_available', version: 3 };
    const legacyPayload = {
      version: 2,
      status: 'data_available',
      queries: [],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };
    const params = {
      structuredContent: legacyPayload,
      _meta: { 'statgpt.dialx.ai/mcp-app': mcpAppPayload },
    };
    expect(resolveToolResult(params)).toBe(mcpAppPayload);
  });

  it('returns null when neither `_meta` nor `structuredContent` yields anything', () => {
    expect(resolveToolResult({})).toBeNull();
  });

  it('falls back to structuredContent when the mcp-app _meta value is explicitly null', () => {
    const legacyPayload = {
      version: 2,
      queries: [],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };
    const params = {
      structuredContent: legacyPayload,
      _meta: { 'statgpt.dialx.ai/mcp-app': null },
    };
    expect(resolveToolResult(params)).toBe(legacyPayload);
  });

  it('falls back to structuredContent when the mcp-app _meta value is an empty object', () => {
    const legacyPayload = {
      version: 2,
      queries: [],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };
    const params = {
      structuredContent: legacyPayload,
      _meta: { 'statgpt.dialx.ai/mcp-app': {} },
    };
    expect(resolveToolResult(params)).toBe(legacyPayload);
  });

  it('warns when structuredContent has queries but no tools and no mcp-app _meta', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const strippedPayload = { queries: [{ urn: 'IMF.RES:WEO(9.0.0)' }] };
    const result = resolveToolResult({ structuredContent: strippedPayload });
    expect(result).toBe(strippedPayload);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('does not warn for a well-formed legacy structuredContent (has tools)', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const legacyPayload = {
      version: 2,
      queries: [],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };
    resolveToolResult({ structuredContent: legacyPayload });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('does not warn when structuredContent has no queries array at all', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    resolveToolResult({ structuredContent: { message: 'no data' } });
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('extractCallToolPayload', () => {
  it('returns the JSON-parsed text content on a successful call', () => {
    const result = {
      content: [{ type: 'text', text: '{"data":{"foo":1}}' }],
      structuredContent: { statusCode: 200, contentType: 'application/json' },
    };
    expect(extractCallToolPayload(result)).toEqual({ data: { foo: 1 } });
  });

  it('unwraps a result nested under `.result` before reading content', () => {
    const result = {
      result: {
        content: [{ type: 'text', text: '{"data":{"foo":2}}' }],
        structuredContent: { statusCode: 200 },
      },
    };
    expect(extractCallToolPayload(result)).toEqual({ data: { foo: 2 } });
  });

  it('throws when structuredContent.statusCode indicates an upstream error', () => {
    const result = {
      content: [{ type: 'text', text: 'not found' }],
      structuredContent: { statusCode: 404, contentType: 'text/plain' },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
    expect(() => extractCallToolPayload(result)).toThrow(/404/);
  });

  it('throws when isError is true even without an error statusCode', () => {
    const result = {
      content: [{ type: 'text', text: 'boom' }],
      structuredContent: { statusCode: 200 },
      isError: true,
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('throws when there is no text content block', () => {
    const result = {
      content: [],
      structuredContent: { statusCode: 200 },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('throws when the text content is not valid JSON', () => {
    const result = {
      content: [{ type: 'text', text: 'not json' }],
      structuredContent: { statusCode: 200 },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('does not fall back to structuredContent as the payload', () => {
    const result = {
      structuredContent: { statusCode: 200, contentType: 'application/json' },
    };
    expect(() => extractCallToolPayload(result)).toThrow(BridgeError);
  });

  it('throws for non-object input', () => {
    expect(() => extractCallToolPayload(null)).toThrow(BridgeError);
    expect(() => extractCallToolPayload('hello')).toThrow(BridgeError);
  });
});
