import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyStateInlineNudge } from '../EmptyStateInlineNudge';
import { Platform } from '../../host/hostContext';

describe('EmptyStateInlineNudge', () => {
  it('renders the heading and description, and calls onBrowse when the button is clicked', () => {
    const onBrowse = vi.fn();
    render(
      <EmptyStateInlineNudge platform={Platform.Desktop} onBrowse={onBrowse} />,
    );
    expect(screen.getByText('Not sure which one fits?')).toBeInTheDocument();
    expect(
      screen.getByText('Browse available dimensions to find the exact one.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Browse' }));
    expect(onBrowse).toHaveBeenCalledTimes(1);
  });

  it("adds mobile edge margin, matching ErrorBanner's bordered-box convention", () => {
    const { container: desktop } = render(
      <EmptyStateInlineNudge platform={Platform.Desktop} onBrowse={vi.fn()} />,
    );
    const { container: mobile } = render(
      <EmptyStateInlineNudge platform={Platform.Mobile} onBrowse={vi.fn()} />,
    );
    expect(desktop.firstChild).not.toHaveClass('mx-4');
    expect(mobile.firstChild).toHaveClass('mx-4');
  });
});
