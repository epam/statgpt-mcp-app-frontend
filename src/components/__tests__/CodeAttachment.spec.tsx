import { act } from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import { CodeAttachment } from '../CodeAttachment';

vi.mock('../../monaco/setupMonaco', () => ({}));

let contentSizeListener: (() => void) | undefined;
let contentHeight = 250;

vi.mock('@monaco-editor/react', () => ({
  Editor: ({
    onMount,
  }: {
    onMount: (editor: unknown, monaco: unknown) => void;
  }) => {
    const fakeEditor = {
      addCommand: vi.fn(),
      getContentHeight: () => contentHeight,
      onDidContentSizeChange: (cb: () => void) => {
        contentSizeListener = cb;
        return { dispose: vi.fn() };
      },
    };
    const fakeMonaco = { KeyCode: { F1: 59 } };
    onMount(fakeEditor, fakeMonaco);
    return <div data-testid="mock-editor" />;
  },
}));

describe('CodeAttachment', () => {
  beforeEach(() => {
    contentSizeListener = undefined;
    contentHeight = 250;
  });

  it('sizes its container to the editor-reported content height', () => {
    const { container } = render(<CodeAttachment code="print(1)" />);
    const box = container.querySelector('[data-testid="mock-editor"]')
      ?.parentElement as HTMLElement;
    expect(box.style.height).toBe('250px');
  });

  it('caps the visible height at 400px via a scrollable wrapper while keeping the full content height available for scroll', () => {
    contentHeight = 1200;
    const { container } = render(<CodeAttachment code="print(1)" />);
    const sizingBox = container.querySelector('[data-testid="mock-editor"]')
      ?.parentElement as HTMLElement;
    const scrollWrapper = sizingBox.parentElement as HTMLElement;
    expect(sizingBox.style.height).toBe('1200px');
    expect(scrollWrapper.className).toContain('max-h-[400px]');
    expect(scrollWrapper.className).toContain('overflow-auto');
  });

  it('applies a minimum height floor for very short content', () => {
    contentHeight = 20;
    const { container } = render(<CodeAttachment code="x = 1" />);
    const sizingBox = container.querySelector('[data-testid="mock-editor"]')
      ?.parentElement as HTMLElement;
    const scrollWrapper = sizingBox.parentElement as HTMLElement;
    expect(scrollWrapper.className).toContain('min-h-[120px]');
  });

  it('re-measures when the editor reports a content size change (e.g. rewrap on resize)', () => {
    const { container } = render(<CodeAttachment code="print(1)" />);
    contentHeight = 600;
    act(() => {
      contentSizeListener?.();
    });
    const box = container.querySelector('[data-testid="mock-editor"]')
      ?.parentElement as HTMLElement;
    expect(box.style.height).toBe('600px');
  });
});
