import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChartLegend } from '../ChartLegend';

describe('ChartLegend', () => {
  it('renders nothing when there are no items', () => {
    const { container } = render(
      <ChartLegend items={[]} selected={{}} onToggle={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders one entry per item, all selected by default', () => {
    render(
      <ChartLegend
        items={[
          { name: 'A', color: '#111111' },
          { name: 'B', color: '#222222' },
        ]}
        selected={{}}
        onToggle={vi.fn()}
      />,
    );
    const a = screen.getByRole('button', { name: 'A' });
    const b = screen.getByRole('button', { name: 'B' });
    expect(a).toHaveAttribute('aria-pressed', 'true');
    expect(b).toHaveAttribute('aria-pressed', 'true');
  });

  it('reflects a deselected item as aria-pressed=false', () => {
    render(
      <ChartLegend
        items={[{ name: 'A', color: '#111111' }]}
        selected={{ A: false }}
        onToggle={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'A' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onToggle with the clicked item name', async () => {
    const onToggle = vi.fn();
    render(
      <ChartLegend
        items={[{ name: 'A', color: '#111111' }]}
        selected={{}}
        onToggle={onToggle}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onToggle).toHaveBeenCalledWith('A');
  });
});
