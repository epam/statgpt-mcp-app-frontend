import '@testing-library/jest-dom';

/**
 * jsdom doesn't implement `ResizeObserver`. Several hooks/components
 * (`useInlineHeightSync`, `ChartView`) construct one unconditionally, so a
 * no-op stub keeps those tests from throwing a `ReferenceError`.
 */
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
