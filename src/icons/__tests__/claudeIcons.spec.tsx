import { render } from '@testing-library/react';
import ClaudeMaximizeDesktop from '../claude/desktop/maximize.svg?react';
import ClaudeMaximizeMobile from '../claude/mobile/maximize.svg?react';

describe('vendored Claude icons', () => {
  it('renders the desktop maximize icon as an svg element', () => {
    const { container } = render(<ClaudeMaximizeDesktop />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the mobile maximize icon as an svg element', () => {
    const { container } = render(<ClaudeMaximizeMobile />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
