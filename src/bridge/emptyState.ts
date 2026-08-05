import {
  DataQueryStatus,
  type DataSetChoice,
  type DimensionValueInfo,
  type WidgetMeta,
} from './types';

export const EmptyStateKind = { Error: 'error', Text: 'text' } as const;
export type EmptyStateKind =
  (typeof EmptyStateKind)[keyof typeof EmptyStateKind];

export type EmptyStateTab =
  | {
      kind: 'datasets';
      id: 'datasets';
      label: 'Datasets';
      datasets: DataSetChoice[];
    }
  | {
      kind: 'dimension';
      id: string;
      label: string;
      values: DimensionValueInfo[];
    };

export interface EmptyStateContent {
  kind: EmptyStateKind;
  message: string;
  tabs: EmptyStateTab[];
}

export const DEFAULT_FALLBACK_MESSAGE =
  'No data was found for the provided query. Try to change the query.';

/**
 * Whether the widget should run its normal fetch/render path for this result, rather
 * than showing an empty/error state.
 *
 * True for schema v2's `status: 'data_available'`.
 *
 * **Also true for a genuine schema v1 payload — this is the schema v1 fallback.**
 * Schema v1 (`version === 1`) predates the `status` field entirely, so a v1 payload
 * reaching this function already has real, executable `queries` and must behave
 * exactly as it did before `status` existed: fetch and render. This fallback requires
 * `version === 1` in addition to a missing `status` — a v2 payload (`version === 2`)
 * that happens to be missing `status` is not v1-shaped and is very likely a bug, so it
 * does NOT get this treatment; it falls through to the empty/error path instead.
 */
export function isDataAvailable(meta: WidgetMeta | null): boolean {
  if (!meta) return false;
  if (meta.status === DataQueryStatus.DataAvailable) return true;
  return meta.status === undefined && meta.version === 1;
}

/**
 * Builds the tab list for an empty state's candidate datasets and/or missing
 * dimensions, independent of `status` — driven purely by which fields are
 * non-empty. A dimension whose `availableValues` is empty is excluded (no
 * tab for an unusable, empty grid).
 *
 * @param meta - Parsed structuredContent, or `null` if the tool result carried none.
 */
export function buildEmptyStateTabs(meta: WidgetMeta | null): EmptyStateTab[] {
  const tabs: EmptyStateTab[] = [];

  if (meta?.candidateDatasets?.length) {
    tabs.push({
      kind: 'datasets',
      id: 'datasets',
      label: 'Datasets',
      datasets: meta.candidateDatasets,
    });
  }

  for (const dimension of meta?.missingDimensions?.dimensions ?? []) {
    if (dimension.availableValues.length) {
      tabs.push({
        kind: 'dimension',
        id: dimension.dimensionId,
        label: dimension.name,
        values: dimension.availableValues,
      });
    }
  }

  return tabs;
}

/**
 * Maps a parsed tool result to what the widget should show in place of the data table,
 * or `null` when {@link isDataAvailable} and the normal fetch/render path should
 * proceed instead.
 *
 * @param meta - Parsed structuredContent, or `null` if the tool result carried none at all.
 * @param toolResultText - The plain-text content block accompanying the tool result, if any.
 */
export function buildEmptyState(
  meta: WidgetMeta | null,
  toolResultText: string | undefined,
): EmptyStateContent | null {
  if (isDataAvailable(meta)) return null;

  const message = meta?.message ?? toolResultText ?? DEFAULT_FALLBACK_MESSAGE;
  const tabs = buildEmptyStateTabs(meta);

  if (meta?.status === DataQueryStatus.Failed) {
    return { kind: EmptyStateKind.Error, message, tabs };
  }

  return { kind: EmptyStateKind.Text, message, tabs };
}
