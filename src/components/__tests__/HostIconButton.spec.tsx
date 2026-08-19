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
});
