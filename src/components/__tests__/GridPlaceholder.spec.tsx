import { render, screen } from '@testing-library/react';
import { GridPlaceholder } from '../GridPlaceholder';

describe('GridPlaceholder', () => {
  it('exposes a status role for screen readers', () => {
    render(<GridPlaceholder />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders a title bar and a 4x4 grid of pill blocks', () => {
    const { container } = render(<GridPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-title"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="placeholder-block"]'),
    ).toHaveLength(16);
  });
});
