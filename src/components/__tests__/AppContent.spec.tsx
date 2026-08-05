import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { AppContent } from '../AppContent';
import { EmptyStateKind } from '../../bridge/emptyState';
import { mockAgGridElementDimensions } from '../../test-utils/mockAgGridElementDimensions';
import type { BridgeSnapshot } from '../../bridge/types';

/**
 * `ConversationViewSidePanelOutlet` pulls in a `flatpickr` directory import
 * that Vitest's ESM resolver cannot follow (unrelated to this test — other
 * specs importing different exports from the same package resolve fine).
 * The `emptyState` branch under test never renders the side panel or reads
 * its close handler; `useDatasetDimensionsMetadataMapOptional` is called
 * unconditionally by `useDataAttachments`, so it needs a stand-in too, but
 * (matching its real behavior outside a provider) never gets called with
 * `crossDataset: null` in these tests.
 */
vi.mock('@epam/statgpt-conversation-view', () => ({
  ConversationViewSidePanelOutlet: () => null,
  useConversationViewSidePanelOptional: () => undefined,
  useDatasetDimensionsMetadataMapOptional: () => undefined,
}));

function baseSnapshot(): BridgeSnapshot {
  return {
    phase: 'ready',
    toolResult: null,
    toolResultReceived: true,
  };
}

const noopRequestFullscreen = () => {};

describe('AppContent — empty state tabs', () => {
  beforeAll(() => {
    mockAgGridElementDimensions();
  });

  it('renders the message and the tab bar when the empty state carries non-empty tabs', () => {
    render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={{
          kind: EmptyStateKind.Text,
          message: 'Multiple datasets match your query.',
          tabs: [
            {
              kind: 'datasets',
              id: 'datasets',
              label: 'Datasets',
              datasets: [{ id: 'a', name: 'Dataset A', isOfficial: true }],
            },
          ],
        }}
        isFillHeight={false}
        isFullscreen={false}
        canRequestFullscreen={false}
        requestFullscreen={noopRequestFullscreen}
        crossDataset={null}
        meta={null}
        effectiveLocale="en"
        pythonCode={undefined}
        platform="desktop"
      />,
    );

    expect(
      screen.getByText('Multiple datasets match your query.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Datasets' }),
    ).toBeInTheDocument();
  });

  it('renders only the message, no tab bar, when the empty state has an empty tabs array', () => {
    render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={{
          kind: EmptyStateKind.Text,
          message: 'No data was found.',
          tabs: [],
        }}
        isFillHeight={false}
        isFullscreen={false}
        canRequestFullscreen={false}
        requestFullscreen={noopRequestFullscreen}
        crossDataset={null}
        meta={null}
        effectiveLocale="en"
        pythonCode={undefined}
        platform="desktop"
      />,
    );

    expect(screen.getByText('No data was found.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the fullscreen button when the empty state carries a grid, even though it is otherwise a fallback state', () => {
    render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={{
          kind: EmptyStateKind.Text,
          message: 'Multiple datasets match your query.',
          tabs: [
            {
              kind: 'datasets',
              id: 'datasets',
              label: 'Datasets',
              datasets: [{ id: 'a', name: 'Dataset A', isOfficial: true }],
            },
          ],
        }}
        isFillHeight={false}
        isFullscreen={false}
        canRequestFullscreen={true}
        requestFullscreen={noopRequestFullscreen}
        crossDataset={null}
        meta={null}
        effectiveLocale="en"
        pythonCode={undefined}
        platform="desktop"
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Expand to fullscreen' }),
    ).toBeInTheDocument();
  });

  it('hides the fullscreen button when the empty state is text-only (no tabs)', () => {
    render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={{
          kind: EmptyStateKind.Text,
          message: 'No data was found.',
          tabs: [],
        }}
        isFillHeight={false}
        isFullscreen={false}
        canRequestFullscreen={true}
        requestFullscreen={noopRequestFullscreen}
        crossDataset={null}
        meta={null}
        effectiveLocale="en"
        pythonCode={undefined}
        platform="desktop"
      />,
    );

    expect(
      screen.queryByRole('button', { name: 'Expand to fullscreen' }),
    ).not.toBeInTheDocument();
  });
});
