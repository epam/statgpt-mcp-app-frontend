import { extractWidgetMeta } from '../parseToolResult';
import { DataQueryStatus } from '../types';

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
      version: 1,
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
      version: 1,
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

  it('includes version 2 when present', () => {
    const withV2 = { ...minimalToolResult, version: 2 as const };
    const result = extractWidgetMeta(withV2);
    expect(result?.version).toBe(2);
  });

  it('omits version when not 1 or 2', () => {
    const withBadVersion = { ...minimalToolResult, version: 3 };
    const result = extractWidgetMeta(withBadVersion);
    expect(result?.version).toBeUndefined();
  });

  it('includes status when present', () => {
    const withStatus = {
      ...minimalToolResult,
      status: DataQueryStatus.NoData,
    };
    const result = extractWidgetMeta(withStatus);
    expect(result?.status).toBe(DataQueryStatus.NoData);
  });

  it('omits status when absent', () => {
    const result = extractWidgetMeta(minimalToolResult);
    expect(result?.status).toBeUndefined();
  });

  it('includes message when present', () => {
    const withMessage = { ...minimalToolResult, message: 'No data found.' };
    const result = extractWidgetMeta(withMessage);
    expect(result?.message).toBe('No data found.');
  });

  it('includes candidateDatasets when present', () => {
    const candidateDatasets = [
      { id: 'ds1', name: 'Dataset One', isOfficial: true },
    ];
    const withCandidates = { ...minimalToolResult, candidateDatasets };
    const result = extractWidgetMeta(withCandidates);
    expect(result?.candidateDatasets).toEqual(candidateDatasets);
  });

  it('omits candidateDatasets when not an array', () => {
    const withBadCandidates = { ...minimalToolResult, candidateDatasets: null };
    const result = extractWidgetMeta(withBadCandidates);
    expect(result?.candidateDatasets).toBeUndefined();
  });

  it('includes missingDimensions when present', () => {
    const missingDimensions = {
      datasetId: 'ds1',
      dimensions: [
        {
          dimensionId: 'COUNTRY',
          name: 'Country',
          availableValues: [{ id: 'USA', name: 'United States' }],
        },
      ],
    };
    const withMissing = { ...minimalToolResult, missingDimensions };
    const result = extractWidgetMeta(withMissing);
    expect(result?.missingDimensions).toEqual(missingDimensions);
  });

  it('omits missingDimensions when null', () => {
    const withNullMissing = { ...minimalToolResult, missingDimensions: null };
    const result = extractWidgetMeta(withNullMissing);
    expect(result?.missingDimensions).toBeUndefined();
  });
});
