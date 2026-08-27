import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { InlineDataHeader } from '../InlineDataHeader';
import { Platform } from '../../host/hostContext';

describe('InlineDataHeader', () => {
  it('renders the given text', () => {
    render(
      <InlineDataHeader
        text="Some caption text."
        platform={Platform.Desktop}
        onExploreData={vi.fn()}
      />,
    );
    expect(screen.getByText('Some caption text.')).toBeInTheDocument();
  });

  it('calls onExploreData when the button is clicked', () => {
    const onExploreData = vi.fn();
    render(
      <InlineDataHeader
        text="Some caption text."
        platform={Platform.Desktop}
        onExploreData={onExploreData}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Explore the data' }));
    expect(onExploreData).toHaveBeenCalledTimes(1);
  });

  it('renders a host-aware expand icon inside the button', () => {
    render(
      <InlineDataHeader
        text="Some caption text."
        platform={Platform.Mobile}
        onExploreData={vi.fn()}
      />,
    );
    expect(
      screen
        .getByRole('button', { name: 'Explore the data' })
        .querySelector('svg'),
    ).toBeInTheDocument();
  });

  it('renders the button with a visible border, matching a bordered pill', () => {
    render(
      <InlineDataHeader
        text="Some caption text."
        platform={Platform.Desktop}
        onExploreData={vi.fn()}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Explore the data' }),
    ).toHaveClass('border');
  });

  it('extends the button to a 44px mobile tap target via the shared hit-slop', () => {
    render(
      <InlineDataHeader
        text="Some caption text."
        platform={Platform.Mobile}
        onExploreData={vi.fn()}
      />,
    );
    const button = screen.getByRole('button', { name: 'Explore the data' });
    expect(button).toHaveClass('before:absolute');
    expect(button).toHaveClass('before:inset-[-4px]');
  });

  it('renders the text at 12px, colored the same as an inactive tab', () => {
    render(
      <InlineDataHeader
        text="Some caption text."
        platform={Platform.Desktop}
        onExploreData={vi.fn()}
      />,
    );
    const label = screen.getByText('Some caption text.');
    expect(label).toHaveClass('text-xs');
    expect(label).toHaveClass('text-neutrals-700');
  });
});
