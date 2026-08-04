import { render } from '@testing-library/react';
import ClaudeMaximizeDesktop from '../claude/desktop/maximize.svg?react';
import ClaudeMaximizeMobile from '../claude/mobile/maximize.svg?react';
import ClaudeExternalLinkDesktop from '../claude/desktop/external-link.svg?react';
import ClaudeExternalLinkMobile from '../claude/mobile/external-link.svg?react';

describe('vendored Claude icons', () => {
  it('renders the desktop maximize icon as an svg element', () => {
    const { container } = render(<ClaudeMaximizeDesktop />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the mobile maximize icon as an svg element', () => {
    const { container } = render(<ClaudeMaximizeMobile />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the desktop external-link icon as an svg element', () => {
    const { container } = render(<ClaudeExternalLinkDesktop />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the mobile external-link icon as an svg element', () => {
    const { container } = render(<ClaudeExternalLinkMobile />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
