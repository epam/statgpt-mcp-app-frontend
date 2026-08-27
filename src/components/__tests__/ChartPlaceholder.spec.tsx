import { render, screen } from '@testing-library/react';
import { ChartPlaceholder } from '../ChartPlaceholder';

describe('ChartPlaceholder', () => {
  it('exposes a status role for screen readers', () => {
    render(<ChartPlaceholder />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders the header row: two caption lines and one button shape', () => {
    const { container } = render(<ChartPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-caption-line"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-testid="placeholder-explore-button"]'),
    ).toHaveLength(1);
  });

  it("renders the chart's own top row: a counter line and two pager button shapes", () => {
    const { container } = render(<ChartPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-chart-counter"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-testid="placeholder-pager-button"]'),
    ).toHaveLength(2);
  });

  it('renders one chart canvas block', () => {
    const { container } = render(<ChartPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-chart-canvas"]'),
    ).toHaveLength(1);
  });

  it('renders a legend row of pill shapes', () => {
    const { container } = render(<ChartPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-legend-pill"]')
        .length,
    ).toBeGreaterThan(0);
  });

  it('renders two dimension label/value rows', () => {
    const { container } = render(<ChartPlaceholder />);
    expect(
      container.querySelectorAll('[data-testid="placeholder-dimension-row"]'),
    ).toHaveLength(2);
  });

  it('runs its shimmer slower than the 2s default shared with GridPlaceholder/CodePlaceholder', () => {
    const { container } = render(<ChartPlaceholder />);
    const chartCanvas = container.querySelector(
      '[data-testid="placeholder-chart-canvas"]',
    );
    expect(chartCanvas).toHaveStyle({ animationDuration: '2.5s' });
  });
});
