import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EmptyStateTabs } from '../EmptyStateTabs';
import { Platform } from '../../host/hostContext';
import type { EmptyStateTab } from '../../bridge/emptyState';
import { mockAgGridElementDimensions } from '../../test-utils/mockAgGridElementDimensions';

const { datasetsGridRenderCount } = vi.hoisted(() => ({
  datasetsGridRenderCount: { current: 0 },
}));

/**
 * Wraps the real `DataGrid` with a render counter instead of stubbing it out
 * entirely, so the existing content assertions below (real ag-grid DOM
 * output) keep working while also letting the memoization regression test
 * observe render counts.
 */
vi.mock('../DataGrid', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../DataGrid')>();
  return {
    ...actual,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic component, test-only wrapper
    DataGrid: (props: any) => {
      datasetsGridRenderCount.current += 1;
      return <actual.DataGrid {...props} />;
    },
  };
});

describe('EmptyStateTabs', () => {
  beforeAll(() => {
    mockAgGridElementDimensions();
  });

  beforeEach(() => {
    datasetsGridRenderCount.current = 0;
  });

  it('renders nothing when tabs is empty', () => {
    const { container } = render(
      <EmptyStateTabs tabs={[]} platform={Platform.Desktop} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one tab button per entry, in order, and the datasets grid with the Official column', async () => {
    const tabs: EmptyStateTab[] = [
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
    ];
    render(<EmptyStateTabs tabs={tabs} platform={Platform.Desktop} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.textContent)).toEqual(['Datasets', 'Country']);

    expect(await screen.findByText('Official')).toBeInTheDocument();
    expect(screen.getByText('Dataset A')).toBeInTheDocument();
  });

  it('renders the dimension grid without an Official column when the Country tab is selected', async () => {
    const tabs: EmptyStateTab[] = [
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
    ];
    render(<EmptyStateTabs tabs={tabs} platform={Platform.Desktop} />);

    fireEvent.click(screen.getByRole('button', { name: 'Country' }));
    expect(await screen.findByText('United States')).toBeInTheDocument();
    expect(screen.queryByText('Official')).not.toBeInTheDocument();
  });

  it('handles tabs going from non-empty to empty on a re-render without crashing (Rules of Hooks: the active-tab hook must run every render)', async () => {
    const tabs: EmptyStateTab[] = [
      {
        kind: 'datasets',
        id: 'datasets',
        label: 'Datasets',
        datasets: [{ id: 'a', name: 'Dataset A', isOfficial: true }],
      },
    ];
    const { rerender, container } = render(
      <EmptyStateTabs tabs={tabs} platform={Platform.Desktop} />,
    );
    expect(await screen.findByText('Dataset A')).toBeInTheDocument();

    rerender(<EmptyStateTabs tabs={[]} platform={Platform.Desktop} />);
    expect(container).toBeEmptyDOMElement();

    rerender(<EmptyStateTabs tabs={tabs} platform={Platform.Desktop} />);
    expect(await screen.findByText('Dataset A')).toBeInTheDocument();
  });

  /**
   * `tabs` keeps the same reference across both renders, matching what
   * `useSdmxData`'s memoized `emptyState` already provides in production —
   * simulating a parent re-render for an unrelated reason.
   */
  it('does not re-render the grid when re-rendered with an unchanged tabs reference', async () => {
    const tabs: EmptyStateTab[] = [
      {
        kind: 'datasets',
        id: 'datasets',
        label: 'Datasets',
        datasets: [{ id: 'a', name: 'Dataset A', isOfficial: true }],
      },
    ];
    const { rerender } = render(
      <EmptyStateTabs tabs={tabs} platform={Platform.Desktop} />,
    );
    await screen.findByText('Dataset A');
    expect(datasetsGridRenderCount.current).toBe(1);

    rerender(<EmptyStateTabs tabs={tabs} platform={Platform.Desktop} />);
    expect(datasetsGridRenderCount.current).toBe(1);
  });
});
