import { render, screen } from '@testing-library/react';
import { GridSlideNav } from '../GridSlideNav';

describe('GridSlideNav', () => {
  it('renders nothing when there are no more rows than the row cap displays', () => {
    const { container } = render(<GridSlideNav hasMoreRows={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the "more rows" hint when there are more rows than the row cap displays', () => {
    render(<GridSlideNav hasMoreRows />);
    expect(
      screen.getByText('To view more, open full view'),
    ).toBeInTheDocument();
  });

  it('never renders a vertical column-truncation hint', () => {
    render(<GridSlideNav hasMoreRows />);
    expect(screen.queryByText(/vertical/i)).not.toBeInTheDocument();
    const hint = screen.getByText('To view more, open full view');
    expect(hint.style.writingMode).not.toBe('vertical-rl');
  });
});
