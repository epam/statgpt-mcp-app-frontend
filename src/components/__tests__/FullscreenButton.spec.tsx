import { render, screen } from '@testing-library/react';
import { Platform } from '../../host/hostContext';
import { FullscreenButton } from '../FullscreenButton';

describe('FullscreenButton', () => {
  it('calls onRequestFullscreen when clicked', () => {
    const onRequestFullscreen = vi.fn();
    render(
      <FullscreenButton
        onRequestFullscreen={onRequestFullscreen}
        platform={Platform.Desktop}
      />,
    );

    screen.getByRole('button', { name: 'Expand to fullscreen' }).click();

    expect(onRequestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('renders a host-aware svg icon', () => {
    const { container } = render(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Mobile}
      />,
    );

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the icon at 20px for desktop', () => {
    const { container } = render(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Desktop}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '20');
    expect(svg).toHaveAttribute('height', '20');
  });

  it('renders the icon at 24px for mobile', () => {
    const { container } = render(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Mobile}
      />,
    );

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('height', '24');
  });

  it('uses p-1.5 padding on both desktop and mobile (visible size stays identical)', () => {
    const { rerender } = render(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Desktop}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Expand to fullscreen' }),
    ).toHaveClass('p-1.5');

    rerender(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Mobile}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Expand to fullscreen' }),
    ).toHaveClass('p-1.5');
  });

  it('does not add an invisible hit-slop area on desktop', () => {
    render(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Desktop}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Expand to fullscreen' }),
    ).not.toHaveClass('before:inset-[-4px]');
  });

  it('adds an invisible 4px hit-slop area on mobile, extending the 36px visible button to a 44x44 tap target without growing what is shown', () => {
    render(
      <FullscreenButton
        onRequestFullscreen={() => {}}
        platform={Platform.Mobile}
      />,
    );

    const button = screen.getByRole('button', { name: 'Expand to fullscreen' });
    expect(button).toHaveClass('before:absolute');
    expect(button).toHaveClass('before:inset-[-4px]');
    expect(button).toHaveClass("before:content-['']");
  });
});
