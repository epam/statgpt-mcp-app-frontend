import { act, render } from '@testing-library/react';
import { useElementWidth } from '../useElementWidth';

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  callback: ResizeObserverCallback;
  observedEl: Element | null = null;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    MockResizeObserver.instances.push(this);
  }
  observe(el: Element) {
    this.observedEl = el;
  }
  unobserve() {}
  disconnect() {}
  trigger(width: number) {
    this.callback(
      [{ contentRect: { width } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

function TestComponent({ onWidth }: { onWidth: (w: number) => void }) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  onWidth(width);
  return <div ref={ref} data-testid="measured" />;
}

describe('useElementWidth', () => {
  beforeEach(() => {
    MockResizeObserver.instances = [];
    (
      window as unknown as { ResizeObserver: typeof ResizeObserver }
    ).ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  });

  it('starts at 0 before any measurement', () => {
    const widths: number[] = [];
    render(<TestComponent onWidth={(w) => widths.push(w)} />);
    expect(widths[0]).toBe(0);
  });

  it('updates to the observed width when ResizeObserver fires', () => {
    const widths: number[] = [];
    render(<TestComponent onWidth={(w) => widths.push(w)} />);
    act(() => {
      MockResizeObserver.instances[0].trigger(742);
    });
    expect(widths[widths.length - 1]).toBe(742);
  });
});
