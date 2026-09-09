import { render, screen } from '@testing-library/react';
import { EmptyStateFullscreenHeader } from '../EmptyStateFullscreenHeader';

describe('EmptyStateFullscreenHeader', () => {
  it('renders the hardcoded title and subtitle', () => {
    render(<EmptyStateFullscreenHeader />);
    expect(screen.getByText('Browse available dimension')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Find the exact name your query needs, then copy it back into your request.',
      ),
    ).toBeInTheDocument();
  });
});
