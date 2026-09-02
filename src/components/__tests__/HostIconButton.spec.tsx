import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Platform } from '../../host/hostContext';
import { HostIconButton } from '../HostIconButton';

function StubIcon({ platform, ...props }: { platform: Platform }) {
  return <svg data-testid="stub-icon" data-platform={platform} {...props} />;
}

describe('HostIconButton', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={onClick}
        ariaLabel="Do thing"
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Do thing' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is borderless by default', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
      />,
    );
    expect(screen.getByRole('button')).not.toHaveClass('border');
  });

  it('adds a border for the bordered variant', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        variant="bordered"
      />,
    );
    expect(screen.getByRole('button')).toHaveClass('border');
  });

  it('uses the same rounding as the plain variant for the bordered variant', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        variant="bordered"
      />,
    );
    expect(screen.getByRole('button')).toHaveClass('rounded-md');
  });

  it('uses the default rounding for the plain variant', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
      />,
    );
    expect(screen.getByRole('button')).toHaveClass('rounded-md');
  });

  it('renders no visible text when label is omitted', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('');
  });

  it('renders the label text after the icon when provided', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        label="Open full view"
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent('Open full view');
  });

  it('renders the label at 12px, colored as primary/black text', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        label="Open full view"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-xs');
    expect(button).toHaveClass('text-neutrals-1000');
  });

  it('uses 6px left padding, 8px right padding, and 6px vertical padding for a labeled button', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        label="Open full view"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('pl-1.5');
    expect(button).toHaveClass('pr-2');
    expect(button).toHaveClass('py-1.5');
    expect(button).not.toHaveClass('px-3');
    expect(button).not.toHaveClass('px-1.5');
  });

  it('still applies the mobile hit-slop when a label is provided', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Mobile}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        label="Open full view"
      />,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveClass('before:absolute');
    expect(button).toHaveClass('before:inset-[-4px]');
  });

  it('is not disabled by default', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
      />,
    );
    expect(screen.getByRole('button', { name: 'Do thing' })).not.toBeDisabled();
  });

  it('applies the native disabled attribute and a dimmed style when disabled is true', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={vi.fn()}
        ariaLabel="Do thing"
        disabled
      />,
    );
    const button = screen.getByRole('button', { name: 'Do thing' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-40');
    expect(button).toHaveClass('pointer-events-none');
  });

  it('does not call onClick when disabled and clicked', async () => {
    const onClick = vi.fn();
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={onClick}
        ariaLabel="Do thing"
        disabled
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Do thing' }));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('HostIconButton floating variant', () => {
  it('applies rounded-full, a background, and the drop shadow', () => {
    render(
      <HostIconButton
        icon={StubIcon}
        platform={Platform.Desktop}
        onClick={() => {}}
        ariaLabel="Next slide"
        variant="floating"
        className="absolute"
      />,
    );
    const button = screen.getByRole('button', { name: 'Next slide' });
    expect(button.className).toContain('rounded-full');
    expect(button.className).toContain('shadow-drop');
  });
});
