import { extractWidgetMeta } from '../parseToolResult';

const minimalQuery = {
  urn: 'ESTAT:DS1(1.0)',
  filters: [{ componentCode: 'FREQ', operator: 'in', values: ['A'] }],
  metadata: {
    countryDimension: '',
    indicatorDimensions: [],
  },
};

const minimalToolResult = {
  version: 1 as const,
  queries: [minimalQuery],
  tools: { sdmxProxy: 'sdmx_proxy_tool' },
};

describe('extractWidgetMeta', () => {
  it('returns null for null input', () => {
    expect(extractWidgetMeta(null)).toBeNull();
  });

  it('returns null for a plain string', () => {
    expect(extractWidgetMeta('not an object')).toBeNull();
  });

  it('returns null for an object missing queries', () => {
    expect(extractWidgetMeta({ tools: { sdmxProxy: 'x' } })).toBeNull();
  });

  it('returns WidgetMeta from a direct WidgetToolResult object', () => {
    const result = extractWidgetMeta(minimalToolResult);
    expect(result).toEqual({
      queries: [minimalQuery],
      sdmxProxyToolName: 'sdmx_proxy_tool',
      title: undefined,
      pythonCode: undefined,
    });
  });

  it('returns WidgetMeta from a notification-params envelope', () => {
    const envelope = { structuredContent: minimalToolResult };
    const result = extractWidgetMeta(envelope);
    expect(result).toEqual({
      queries: [minimalQuery],
      sdmxProxyToolName: 'sdmx_proxy_tool',
      title: undefined,
      pythonCode: undefined,
    });
  });

  it('includes pythonCode when present', () => {
    const withPythonCode = { ...minimalToolResult, pythonCode: 'print(1)' };
    const result = extractWidgetMeta(withPythonCode);
    expect(result?.pythonCode).toBe('print(1)');
  });

  it('includes title when present', () => {
    const withTitle = { ...minimalToolResult, title: 'My Chart' };
    const result = extractWidgetMeta(withTitle);
    expect(result?.title).toBe('My Chart');
  });

  it('omits title when absent', () => {
    const result = extractWidgetMeta(minimalToolResult);
    expect(result?.title).toBeUndefined();
  });
});
