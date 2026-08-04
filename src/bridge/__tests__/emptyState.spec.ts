import {
  buildEmptyState,
  DEFAULT_FALLBACK_MESSAGE,
  EmptyStateKind,
  isDataAvailable,
} from '../emptyState';
import { DataQueryStatus, type WidgetMeta } from '../types';

function meta(overrides: Partial<WidgetMeta> = {}): WidgetMeta {
  return {
    queries: [],
    sdmxProxyToolName: 'sdmx_proxy',
    ...overrides,
  };
}

describe('buildEmptyState', () => {
  it('returns null for status "data_available"', () => {
    expect(
      buildEmptyState(
        meta({ status: DataQueryStatus.DataAvailable }),
        undefined,
      ),
    ).toBeNull();
  });

  it('returns null when status is absent and version is 1 (schema v1 fallback)', () => {
    expect(
      buildEmptyState(
        meta({ status: undefined, version: 1, queries: [] }),
        undefined,
      ),
    ).toBeNull();
  });

  it('does not apply the v1 fallback when status is absent but version is not 1', () => {
    const result = buildEmptyState(
      meta({ status: undefined, version: 2 }),
      undefined,
    );
    expect(result?.kind).toBe(EmptyStateKind.Text);
  });

  it('returns a text state with the default fallback when meta is null and there is no toolResultText', () => {
    expect(buildEmptyState(null, undefined)).toEqual({
      kind: EmptyStateKind.Text,
      message: DEFAULT_FALLBACK_MESSAGE,
    });
  });

  it('returns a text state using toolResultText when meta is null but toolResultText is present', () => {
    expect(buildEmptyState(null, 'raw text content')).toEqual({
      kind: EmptyStateKind.Text,
      message: 'raw text content',
    });
  });

  it('resolves message from meta.message first when both meta.message and toolResultText are present', () => {
    const result = buildEmptyState(
      meta({ status: DataQueryStatus.NoData, message: 'structured message' }),
      'text block message',
    );
    expect(result).toEqual({
      kind: EmptyStateKind.Text,
      message: 'structured message',
    });
  });

  it('falls back to toolResultText when meta.message is absent', () => {
    const result = buildEmptyState(
      meta({ status: DataQueryStatus.ExecutedNoData }),
      'text block message',
    );
    expect(result).toEqual({
      kind: EmptyStateKind.Text,
      message: 'text block message',
    });
  });

  it('falls back to the default message when neither meta.message nor toolResultText is present', () => {
    const result = buildEmptyState(
      meta({ status: DataQueryStatus.NotExecuted }),
      undefined,
    );
    expect(result).toEqual({
      kind: EmptyStateKind.Text,
      message: DEFAULT_FALLBACK_MESSAGE,
    });
  });

  it('returns kind "error" for status "failed"', () => {
    const result = buildEmptyState(
      meta({ status: DataQueryStatus.Failed, message: undefined }),
      'the following queries were executed...',
    );
    expect(result).toEqual({
      kind: EmptyStateKind.Error,
      message: 'the following queries were executed...',
    });
  });

  it('returns kind "text" for every other status', () => {
    const statuses = [
      DataQueryStatus.NoData,
      DataQueryStatus.ExecutedNoData,
      DataQueryStatus.NotExecuted,
      DataQueryStatus.InvalidTimePeriod,
    ];
    for (const status of statuses) {
      const result = buildEmptyState(meta({ status, message: 'm' }), undefined);
      expect(result?.kind).toBe(EmptyStateKind.Text);
    }
  });

  it('appends an unlabeled comma-separated paragraph from candidateDatasets for dataset_selection_required', () => {
    const result = buildEmptyState(
      meta({
        status: DataQueryStatus.DatasetSelectionRequired,
        message: 'Multiple datasets match.',
        candidateDatasets: [
          { id: 'a', name: 'Dataset A', isOfficial: true },
          { id: 'b', name: 'Dataset B', isOfficial: false },
        ],
      }),
      undefined,
    );
    expect(result).toEqual({
      kind: EmptyStateKind.Text,
      message: 'Multiple datasets match.\n\nDataset A, Dataset B',
    });
  });

  it('appends nothing for dataset_selection_required when candidateDatasets is empty', () => {
    const result = buildEmptyState(
      meta({
        status: DataQueryStatus.DatasetSelectionRequired,
        message: 'Multiple datasets match.',
        candidateDatasets: [],
      }),
      undefined,
    );
    expect(result?.message).toBe('Multiple datasets match.');
  });

  it('appends one unlabeled paragraph for a single missing dimension', () => {
    const result = buildEmptyState(
      meta({
        status: DataQueryStatus.MissingDimensions,
        message: 'Your query is missing the Country dimension.',
        missingDimensions: {
          datasetId: 'ds1',
          dimensions: [
            {
              dimensionId: 'COUNTRY',
              name: 'Country',
              availableValues: [
                { id: 'USA', name: 'United States' },
                { id: 'FRA', name: 'France' },
              ],
            },
          ],
        },
      }),
      undefined,
    );
    expect(result).toEqual({
      kind: EmptyStateKind.Text,
      message:
        'Your query is missing the Country dimension.\n\nUnited States, France',
    });
  });

  it('labels each paragraph with the dimension name when more than one dimension is missing', () => {
    const result = buildEmptyState(
      meta({
        status: DataQueryStatus.MissingDimensions,
        message: 'Two dimensions are missing.',
        missingDimensions: {
          datasetId: 'ds1',
          dimensions: [
            {
              dimensionId: 'COUNTRY',
              name: 'Country',
              availableValues: [{ id: 'USA', name: 'United States' }],
            },
            {
              dimensionId: 'INDICATOR',
              name: 'Indicator',
              availableValues: [{ id: 'GDP', name: 'GDP' }],
            },
          ],
        },
      }),
      undefined,
    );
    expect(result?.message).toBe(
      'Two dimensions are missing.\n\nCountry: United States\n\nIndicator: GDP',
    );
  });

  it('keeps an empty paragraph for a dimension with no available values rather than dropping it', () => {
    const result = buildEmptyState(
      meta({
        status: DataQueryStatus.MissingDimensions,
        message: 'm',
        missingDimensions: {
          datasetId: 'ds1',
          dimensions: [
            { dimensionId: 'COUNTRY', name: 'Country', availableValues: [] },
            {
              dimensionId: 'INDICATOR',
              name: 'Indicator',
              availableValues: [{ id: 'GDP', name: 'GDP' }],
            },
          ],
        },
      }),
      undefined,
    );
    expect(result?.message).toBe('m\n\nCountry: \n\nIndicator: GDP');
  });
});

describe('isDataAvailable', () => {
  it('returns false for null meta', () => {
    expect(isDataAvailable(null)).toBe(false);
  });

  it('returns true for status "data_available"', () => {
    expect(
      isDataAvailable(meta({ status: DataQueryStatus.DataAvailable })),
    ).toBe(true);
  });

  it('returns true when status is absent and version is 1 — schema v1 predates the status field', () => {
    expect(isDataAvailable(meta({ status: undefined, version: 1 }))).toBe(true);
  });

  it('returns false when status is absent but version is not 1 (e.g. a malformed v2 payload)', () => {
    expect(isDataAvailable(meta({ status: undefined, version: 2 }))).toBe(
      false,
    );
    expect(isDataAvailable(meta({ status: undefined }))).toBe(false);
  });

  it('returns false for any other explicit status', () => {
    expect(isDataAvailable(meta({ status: DataQueryStatus.NoData }))).toBe(
      false,
    );
    expect(isDataAvailable(meta({ status: DataQueryStatus.Failed }))).toBe(
      false,
    );
  });
});
