import { render } from '@testing-library/react';
import ChatGPTExpand from '../chatgpt/expand.svg?react';
import ChatGPTExternalLink from '../chatgpt/external-link.svg?react';
import ChatGPTInfo from '../chatgpt/info.svg?react';

describe('vendored ChatGPT icons', () => {
  it('renders the expand icon as an svg element', () => {
    const { container } = render(<ChatGPTExpand />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the external-link icon as an svg element', () => {
    const { container } = render(<ChatGPTExternalLink />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders the info icon as an svg element', () => {
    const { container } = render(<ChatGPTInfo />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
