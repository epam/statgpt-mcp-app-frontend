import { renderHook } from '@testing-library/react';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import { useDataAttachments } from '../useDataAttachments';
import type { CrossDatasetInputs } from '../../types/sdmx';
import type { WidgetMeta } from '../../bridge/types';

vi.mock('@epam/statgpt-conversation-view', () => ({
  buildCrossDatasetChartingData: vi.fn(),
  buildCrossDatasetGridContent: vi.fn().mockReturnValue({
    data: [],
    columns: [],
  }),
  useDatasetDimensionsMetadataMapOptional: vi.fn().mockReturnValue(undefined),
}));

function makeDataQuery(overrides: Partial<DataQuery> = {}): DataQuery {
  return {
    urn: 'urn:default',
    metadata: { countryDimension: '', indicatorDimensions: [] },
    ...overrides,
  } as DataQuery;
}

function makeCrossDataset(dataQueries: DataQuery[]): CrossDatasetInputs {
  return {
    structuresMap: new Map(),
    dataMessagesMap: new Map(),
    dataQueries,
  };
}

const BASE_INPUT = {
  meta: null as WidgetMeta | null,
  effectiveLocale: 'en',
  isFullscreen: false,
};

describe('useDataAttachments', () => {
  it('returns an undefined externalLinksMap when there is no cross-dataset input', () => {
    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset: null }),
    );

    expect(result.current.externalLinksMap).toBeUndefined();
  });

  it('maps each query urn to its datasetUrl', () => {
    const crossDataset = makeCrossDataset([
      makeDataQuery({
        urn: 'urn:a',
        metadata: {
          countryDimension: '',
          indicatorDimensions: [],
          datasetUrl: 'https://example.com/a',
        },
      }),
      makeDataQuery({
        urn: 'urn:b',
        metadata: {
          countryDimension: '',
          indicatorDimensions: [],
          datasetUrl: 'https://example.com/b',
        },
      }),
    ]);

    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset }),
    );

    expect(result.current.externalLinksMap).toEqual(
      new Map([
        ['urn:a', 'https://example.com/a'],
        ['urn:b', 'https://example.com/b'],
      ]),
    );
  });

  it('omits queries with no datasetUrl instead of mapping them to undefined', () => {
    const crossDataset = makeCrossDataset([
      makeDataQuery({ urn: 'urn:no-link' }),
      makeDataQuery({
        urn: 'urn:has-link',
        metadata: {
          countryDimension: '',
          indicatorDimensions: [],
          datasetUrl: 'https://example.com/has-link',
        },
      }),
    ]);

    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset }),
    );

    expect(result.current.externalLinksMap).toEqual(
      new Map([['urn:has-link', 'https://example.com/has-link']]),
    );
  });

  it('returns an empty map when no query has a datasetUrl', () => {
    const crossDataset = makeCrossDataset([makeDataQuery({ urn: 'urn:a' })]);

    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset }),
    );

    expect(result.current.externalLinksMap).toEqual(new Map());
  });
});
