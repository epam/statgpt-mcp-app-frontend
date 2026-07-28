import { render, screen } from '@testing-library/react';
import { CodePlaceholder } from '../CodePlaceholder';

describe('CodePlaceholder', () => {
  it('exposes a status role for screen readers', () => {
    render(<CodePlaceholder />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders 4 rows, each with a bullet and a bar', () => {
    const { container } = render(<CodePlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-row"]'),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-testid="placeholder-bullet"]'),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-testid="placeholder-bar"]'),
    ).toHaveLength(4);
  });

  it('varies each row bar width so lines do not look uniform', () => {
    const { container } = render(<CodePlaceholder />);
    const bars = Array.from(
      container.querySelectorAll<HTMLElement>(
        '[data-testid="placeholder-bar"]',
      ),
    );
    const widths = bars.map((bar) => bar.style.maxWidth);
    expect(new Set(widths).size).toBeGreaterThan(1);
  });
});
