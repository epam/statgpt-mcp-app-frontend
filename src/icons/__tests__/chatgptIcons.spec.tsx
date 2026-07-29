import { render } from '@testing-library/react';
import ChatGPTExpand from '../chatgpt/expand.svg?react';

describe('vendored ChatGPT icons', () => {
  it('renders the expand icon as an svg element', () => {
    const { container } = render(<ChatGPTExpand />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
