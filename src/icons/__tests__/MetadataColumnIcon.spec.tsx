import { render } from '@testing-library/react';
import { Platform } from '../../host/hostContext';
import { MetadataColumnIcon } from '../MetadataColumnIcon';

describe('MetadataColumnIcon', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('renders an svg element for claude + desktop', () => {
    const { container } = render(
      <MetadataColumnIcon platform={Platform.Desktop} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an svg element for claude + mobile', () => {
    const { container } = render(
      <MetadataColumnIcon platform={Platform.Mobile} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an svg element for chatgpt regardless of platform', () => {
    (window as unknown as { openai?: unknown }).openai = {};
    const { container } = render(
      <MetadataColumnIcon platform={Platform.Desktop} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards className to the underlying icon', () => {
    const { container } = render(
      <MetadataColumnIcon platform={Platform.Desktop} className="size-5" />,
    );
    expect(container.querySelector('svg')).toHaveClass('size-5');
  });
});
