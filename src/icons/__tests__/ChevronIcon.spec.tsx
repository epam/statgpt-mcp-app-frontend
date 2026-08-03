import { render } from '@testing-library/react';
import { Platform } from '../../host/hostContext';
import { ChevronLeftIcon, ChevronRightIcon } from '../ChevronIcon';

describe('ChevronLeftIcon', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('renders an svg element for claude + desktop', () => {
    const { container } = render(
      <ChevronLeftIcon platform={Platform.Desktop} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an svg element for claude + mobile', () => {
    const { container } = render(
      <ChevronLeftIcon platform={Platform.Mobile} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders an svg element for chatgpt regardless of platform', () => {
    (window as unknown as { openai?: unknown }).openai = {};
    const { container } = render(
      <ChevronLeftIcon platform={Platform.Desktop} />,
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('does not mirror the icon', () => {
    const { container } = render(
      <ChevronLeftIcon platform={Platform.Desktop} />,
    );
    const svg = container.querySelector('svg');
    expect(svg?.style.transform).toBe('');
  });
});

describe('ChevronRightIcon', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('renders the same glyph mirrored horizontally', () => {
    const { container } = render(
      <ChevronRightIcon platform={Platform.Desktop} />,
    );
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.style.transform).toBe('scaleX(-1)');
  });
});
