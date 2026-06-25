import { getParsedResponse } from '@epam/statgpt-sdmx-toolkit';
import { extractWidgetMeta, normalizeSdmxDataResponse } from '../parse';

vi.mock('@epam/statgpt-sdmx-toolkit', () => ({
  getParsedResponse: vi.fn(),
  sortPeriods: (a: string, b: string) => a.localeCompare(b),
}));

const minimalQuery = {
  sdmx: {
    context: 'dataflow',
    agency_id: 'ESTAT',
    resource_id: 'DS1',
    version: '1.0',
    key: 'A',
  },
};

const minimalToolResult = {
  version: 1 as const,
  queries: [minimalQuery],
  tools: { sdmx_proxy: 'sdmx_proxy_tool' },
};

describe('extractWidgetMeta', () => {
  it('returns null for null input', () => {
    expect(extractWidgetMeta(null)).toBeNull();
  });

  it('returns null for a plain string', () => {
    expect(extractWidgetMeta('not an object')).toBeNull();
  });

  it('returns null for an object missing queries', () => {
    expect(extractWidgetMeta({ tools: { sdmx_proxy: 'x' } })).toBeNull();
  });

  it('returns WidgetMeta from a direct WidgetToolResult object', () => {
    const result = extractWidgetMeta(minimalToolResult);
    expect(result).toEqual({
      queries: [minimalQuery],
      sdmxProxyToolName: 'sdmx_proxy_tool',
      title: undefined,
    });
  });

  it('returns WidgetMeta from a notification-params envelope', () => {
    const envelope = { structuredContent: minimalToolResult };
    const result = extractWidgetMeta(envelope);
    expect(result).toEqual({
      queries: [minimalQuery],
      sdmxProxyToolName: 'sdmx_proxy_tool',
      title: undefined,
    });
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

describe('normalizeSdmxDataResponse', () => {
  beforeEach(() => vi.resetAllMocks());

  it('returns empty model for null input', () => {
    expect(normalizeSdmxDataResponse(null)).toEqual({
      periods: [],
      series: [],
    });
  });

  it('returns empty model when getParsedResponse returns an empty array', () => {
    vi.mocked(getParsedResponse).mockReturnValue([]);
    expect(normalizeSdmxDataResponse({})).toEqual({ periods: [], series: [] });
  });

  it('returns correct periods and series structure for one time series', () => {
    vi.mocked(getParsedResponse).mockReturnValue([
      {
        name: 'Series A',
        parsedTimeSeriesValue: ['VAL1'],
        values: [{ dimensionAtObservation: '2020', values: [{ value: '42' }] }],
      },
    ] as ReturnType<typeof getParsedResponse>);

    const model = normalizeSdmxDataResponse({});

    expect(model.periods).toEqual(['2020']);
    expect(model.series).toHaveLength(1);
    expect(model.series[0].name).toBe('Series A');
    expect(model.series[0].data).toEqual([42]);
  });
});
