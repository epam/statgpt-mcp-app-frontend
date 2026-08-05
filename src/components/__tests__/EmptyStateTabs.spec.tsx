import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateTabs } from '../EmptyStateTabs';
import type { EmptyStateTab } from '../../bridge/emptyState';
import { mockAgGridElementDimensions } from '../../test-utils/mockAgGridElementDimensions';

describe('EmptyStateTabs', () => {
  beforeAll(() => {
    mockAgGridElementDimensions();
  });

  it('renders nothing when tabs is empty', () => {
    const { container } = render(<EmptyStateTabs tabs={[]} />);
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
    render(<EmptyStateTabs tabs={tabs} />);

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
    render(<EmptyStateTabs tabs={tabs} />);

    fireEvent.click(screen.getByRole('button', { name: 'Country' }));
    expect(await screen.findByText('United States')).toBeInTheDocument();
    expect(screen.queryByText('Official')).not.toBeInTheDocument();
  });
});
