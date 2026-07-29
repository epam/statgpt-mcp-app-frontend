import { render } from '@testing-library/react';
import { Platform } from '../../host/hostContext';
import { FullscreenIcon } from '../FullscreenIcon';

describe('FullscreenIcon', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('renders an svg element for claude + desktop', () => {
    const { container } = render(
      <FullscreenIcon platform={Platform.Desktop} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an svg element for claude + mobile', () => {
    const { container } = render(<FullscreenIcon platform={Platform.Mobile} />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an svg element for chatgpt regardless of platform', () => {
    (window as unknown as { openai?: unknown }).openai = {};
    const { container } = render(
      <FullscreenIcon platform={Platform.Desktop} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards width/height props to the underlying icon', () => {
    const { container } = render(
      <FullscreenIcon platform={Platform.Desktop} width={18} height={18} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '18');
    expect(svg).toHaveAttribute('height', '18');
  });
});
