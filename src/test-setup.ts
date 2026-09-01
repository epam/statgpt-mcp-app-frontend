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

/**
 * jsdom doesn't implement `window.matchMedia`. `useIsMobile` (used to
 * predict the shared grid component's own viewport-width column clamp)
 * constructs one unconditionally, so a no-op stub (never matches) keeps
 * those tests from throwing a `TypeError`.
 */
if (typeof window.matchMedia === 'undefined') {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
