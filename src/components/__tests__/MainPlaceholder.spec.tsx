import { render, screen } from '@testing-library/react';
import { MainPlaceholder } from '../MainPlaceholder';

describe('MainPlaceholder', () => {
  it('exposes a status role for screen readers', () => {
    render(<MainPlaceholder />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a title bar and a 4x4 grid of pill blocks', () => {
    const { container } = render(<MainPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-title"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="placeholder-block"]'),
    ).toHaveLength(16);
  });
});
