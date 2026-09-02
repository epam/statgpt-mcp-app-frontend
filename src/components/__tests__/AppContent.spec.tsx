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

  it.each([
    ['desktop' as const, 'pr-10'],
    ['mobile' as const, 'pr-11'],
  ])(
    'reserves a %s-sized gutter on the message when the fullscreen button is shown beside it',
    (platform, gutterClass) => {
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
          platform={platform}
        />,
      );

      const messageGutter = screen.getByText(
        'Multiple datasets match your query.',
      ).parentElement?.parentElement;
      expect(messageGutter?.className).toContain(gutterClass);
    },
  );

  it('does not reserve a gutter on the message when the fullscreen button is hidden', () => {
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

    const messageGutter = screen.getByText(
      'Multiple datasets match your query.',
    ).parentElement?.parentElement;
    expect(messageGutter?.className).not.toContain('pr-10');
    expect(messageGutter?.className).not.toContain('pr-11');
  });
});

describe('AppContent — floating fullscreen button vs DataView inline content', () => {
  beforeAll(() => {
    mockAgGridElementDimensions();
  });

  it("hides the floating FullscreenButton for DataView's plain inline content (no empty state)", () => {
    render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={null}
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

  it('still shows the floating FullscreenButton in pip mode for the same (non-empty-state) content', () => {
    render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={null}
        isFillHeight={true}
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
});

describe('AppContent — loading placeholder by display mode', () => {
  beforeAll(() => {
    mockAgGridElementDimensions();
  });

  it('renders GridPlaceholder while loading in inline mode', () => {
    const { container } = render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={true}
        error={null}
        emptyState={null}
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
      container.querySelector('[data-testid="placeholder-block"]'),
    ).toBeInTheDocument();
  });

  it('renders GridPlaceholder while loading in pip/fullscreen mode', () => {
    const { container } = render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={true}
        error={null}
        emptyState={null}
        isFillHeight={true}
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
      container.querySelector('[data-testid="placeholder-block"]'),
    ).toBeInTheDocument();
  });
});

describe('AppContent — outer wrapper margin', () => {
  it('keeps horizontal margin in inline mode while the loading placeholder is showing', () => {
    const { container } = render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={true}
        error={null}
        emptyState={null}
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
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('my-4');
    expect(wrapper).toHaveClass('mx-4');
  });

  it('drops both vertical and horizontal margin in genuine inline mode', () => {
    const { container } = render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={null}
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
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('my-4');
    expect(wrapper).not.toHaveClass('mx-4');
    expect(wrapper).not.toHaveClass('m-4');
  });

  it('keeps both vertical and horizontal margin in pip mode', () => {
    const { container } = render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={null}
        isFillHeight={true}
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
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveClass('my-4');
    expect(wrapper).toHaveClass('mx-4');
  });

  it('keeps neither vertical nor horizontal margin in fullscreen mode', () => {
    const { container } = render(
      <AppContent
        snapshot={baseSnapshot()}
        loading={false}
        error={null}
        emptyState={null}
        isFillHeight={true}
        isFullscreen={true}
        canRequestFullscreen={false}
        requestFullscreen={noopRequestFullscreen}
        crossDataset={null}
        meta={null}
        effectiveLocale="en"
        pythonCode={undefined}
        platform="desktop"
      />,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).not.toHaveClass('my-4');
    expect(wrapper).not.toHaveClass('mx-4');
    expect(wrapper).not.toHaveClass('m-4');
  });
});
