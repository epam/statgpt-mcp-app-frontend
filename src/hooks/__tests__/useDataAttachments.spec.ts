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
  it('returns an undefined crossDatasetGridAttachment when there is no cross-dataset input', () => {
    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset: null }),
    );

    expect(result.current.crossDatasetGridAttachment).toBeUndefined();
  });

  it('returns a crossDatasetGridAttachment when cross-dataset input is present', () => {
    const crossDataset = makeCrossDataset([makeDataQuery({ urn: 'urn:a' })]);

    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset }),
    );

    expect(result.current.crossDatasetGridAttachment).toEqual({
      data: [],
      columns: [],
    });
  });
});
