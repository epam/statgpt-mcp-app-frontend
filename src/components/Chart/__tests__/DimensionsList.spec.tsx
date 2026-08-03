import { render, screen } from '@testing-library/react';
import { DimensionsList } from '../DimensionsList';

describe('DimensionsList', () => {
  it('renders nothing when there are no dimensions', () => {
    const { container } = render(<DimensionsList dimensions={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a label/value row for each dimension', () => {
    render(
      <DimensionsList
        dimensions={[
          { id: 'freq', title: 'Frequency', value: 'Annual' },
          { id: 'unit', title: 'Unit', value: 'Euro' },
        ]}
      />,
    );
    expect(screen.getByText('Frequency:')).toBeInTheDocument();
    expect(screen.getByText('Annual')).toBeInTheDocument();
    expect(screen.getByText('Unit:')).toBeInTheDocument();
    expect(screen.getByText('Euro')).toBeInTheDocument();
  });

  it('preserves dimension order', () => {
    render(
      <DimensionsList
        dimensions={[
          { id: 'a', title: 'First', value: '1' },
          { id: 'b', title: 'Second', value: '2' },
        ]}
      />,
    );
    const titles = screen.getAllByText(/:$/).map((el) => el.textContent);
    expect(titles).toEqual(['First:', 'Second:']);
  });
});
