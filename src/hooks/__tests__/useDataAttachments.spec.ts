import { renderHook } from '@testing-library/react';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import { useDataAttachments } from '../useDataAttachments';
import type { CrossDatasetInputs } from '../../types/sdmx';
import type { WidgetMeta } from '../../bridge/types';

const { isChartingDataPlottable } = vi.hoisted(() => ({
  isChartingDataPlottable: vi.fn().mockReturnValue(true),
}));

vi.mock('@epam/statgpt-conversation-view', () => ({
  buildCrossDatasetChartingData: vi.fn().mockReturnValue({ units: [] }),
  buildCrossDatasetGridContent: vi.fn().mockReturnValue({
    data: [],
    columns: [],
  }),
  isChartingDataPlottable,
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
  beforeEach(() => {
    isChartingDataPlottable.mockReturnValue(true);
  });

  it('returns a chartAttachment when the built charting data is plottable', () => {
    const crossDataset = makeCrossDataset([makeDataQuery({ urn: 'urn:a' })]);

    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset }),
    );

    expect(result.current.chartAttachment).toBeDefined();
  });

  it('returns an undefined chartAttachment when the built charting data has no plottable units', () => {
    isChartingDataPlottable.mockReturnValue(false);
    const crossDataset = makeCrossDataset([makeDataQuery({ urn: 'urn:a' })]);

    const { result } = renderHook(() =>
      useDataAttachments({ ...BASE_INPUT, crossDataset }),
    );

    expect(result.current.chartAttachment).toBeUndefined();
  });

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
