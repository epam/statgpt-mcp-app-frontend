import {
  buildEmptyState,
  buildEmptyStateTabs,
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
      tabs: [],
    });
  });

  it('returns a text state using toolResultText when meta is null but toolResultText is present', () => {
    expect(buildEmptyState(null, 'raw text content')).toEqual({
      kind: EmptyStateKind.Text,
      message: 'raw text content',
      tabs: [],
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
      tabs: [],
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
      tabs: [],
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
      tabs: [],
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
      tabs: [],
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

  it('carries the datasets tab through from buildEmptyStateTabs, message left unchanged', () => {
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
      message: 'Multiple datasets match.',
      tabs: [
        {
          kind: 'datasets',
          id: 'datasets',
          label: 'Datasets',
          datasets: [
            { id: 'a', name: 'Dataset A', isOfficial: true },
            { id: 'b', name: 'Dataset B', isOfficial: false },
          ],
        },
      ],
    });
  });
});

describe('buildEmptyStateTabs', () => {
  it('returns an empty array when there are no lists at all', () => {
    expect(buildEmptyStateTabs(meta())).toEqual([]);
    expect(buildEmptyStateTabs(null)).toEqual([]);
  });

  it('produces a single "datasets" tab from candidateDatasets', () => {
    const result = buildEmptyStateTabs(
      meta({
        candidateDatasets: [
          { id: 'a', name: 'Dataset A', isOfficial: true },
          { id: 'b', name: 'Dataset B', isOfficial: false },
        ],
      }),
    );
    expect(result).toEqual([
      {
        kind: 'datasets',
        id: 'datasets',
        label: 'Datasets',
        datasets: [
          { id: 'a', name: 'Dataset A', isOfficial: true },
          { id: 'b', name: 'Dataset B', isOfficial: false },
        ],
      },
    ]);
  });

  it('produces no tab when candidateDatasets is empty', () => {
    expect(buildEmptyStateTabs(meta({ candidateDatasets: [] }))).toEqual([]);
  });

  it('produces one dimension tab for a single missing dimension', () => {
    const result = buildEmptyStateTabs(
      meta({
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
    );
    expect(result).toEqual([
      {
        kind: 'dimension',
        id: 'COUNTRY',
        label: 'Country',
        values: [
          { id: 'USA', name: 'United States' },
          { id: 'FRA', name: 'France' },
        ],
      },
    ]);
  });

  it('produces one tab per missing dimension when several are missing', () => {
    const result = buildEmptyStateTabs(
      meta({
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
    );
    expect(result).toEqual([
      {
        kind: 'dimension',
        id: 'COUNTRY',
        label: 'Country',
        values: [{ id: 'USA', name: 'United States' }],
      },
      {
        kind: 'dimension',
        id: 'INDICATOR',
        label: 'Indicator',
        values: [{ id: 'GDP', name: 'GDP' }],
      },
    ]);
  });

  it('excludes a dimension tab when its availableValues is empty', () => {
    const result = buildEmptyStateTabs(
      meta({
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
    );
    expect(result).toEqual([
      {
        kind: 'dimension',
        id: 'INDICATOR',
        label: 'Indicator',
        values: [{ id: 'GDP', name: 'GDP' }],
      },
    ]);
  });

  it('produces both a datasets tab and dimension tabs when both are populated (defensive, status-independent)', () => {
    const result = buildEmptyStateTabs(
      meta({
        candidateDatasets: [{ id: 'a', name: 'Dataset A', isOfficial: true }],
        missingDimensions: {
          datasetId: 'ds1',
          dimensions: [
            {
              dimensionId: 'COUNTRY',
              name: 'Country',
              availableValues: [{ id: 'USA', name: 'United States' }],
            },
          ],
        },
      }),
    );
    expect(result).toEqual([
      {
        kind: 'datasets',
        id: 'datasets',
        label: 'Datasets',
        datasets: [{ id: 'a', name: 'Dataset A', isOfficial: true }],
      },
      {
        kind: 'dimension',
        id: 'COUNTRY',
        label: 'Country',
        values: [{ id: 'USA', name: 'United States' }],
      },
    ]);
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
