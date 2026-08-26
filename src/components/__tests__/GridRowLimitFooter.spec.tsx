import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { GridRowLimitFooter } from '../GridRowLimitFooter';
import { Platform } from '../../host/hostContext';

describe('GridRowLimitFooter', () => {
  it('shows how many rows are visible out of the total', () => {
    render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Mobile}
        onOpenFullView={vi.fn()}
      />,
    );
    expect(screen.getByText('Showing 3 of 12 results')).toBeInTheDocument();
  });

  it('calls onOpenFullView when the button is clicked', () => {
    const onOpenFullView = vi.fn();
    render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Mobile}
        onOpenFullView={onOpenFullView}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Open full view' }));
    expect(onOpenFullView).toHaveBeenCalledTimes(1);
  });

  it('renders a host-aware expand icon inside the button', () => {
    const { container } = render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Mobile}
        onOpenFullView={vi.fn()}
      />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Open full view' })
        .querySelector('svg'),
    ).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('renders the button with a visible border, matching a bordered pill', () => {
    render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Desktop}
        onOpenFullView={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Open full view' })).toHaveClass(
      'border',
    );
  });

  it('extends the button to a 44px mobile tap target via the shared hit-slop', () => {
    render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Mobile}
        onOpenFullView={vi.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: 'Open full view' });
    expect(button).toHaveClass('before:absolute');
    expect(button).toHaveClass('before:inset-[-4px]');
  });

  it('renders the "Showing N of total" text at 12px, colored the same as an inactive tab', () => {
    render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Desktop}
        onOpenFullView={vi.fn()}
      />,
    );
    const label = screen.getByText('Showing 3 of 12 results');
    expect(label).toHaveClass('text-xs');
    expect(label).toHaveClass('text-neutrals-700');
  });

  it('does not add the mobile hit-slop on desktop', () => {
    render(
      <GridRowLimitFooter
        total={12}
        visible={3}
        platform={Platform.Desktop}
        onOpenFullView={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Open full view' }),
    ).not.toHaveClass('before:absolute');
  });
});
