import { renderHook } from '@testing-library/react';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { useHostLayout } from '../useHostLayout';

function makeHostContext(
  overrides: Partial<McpUiHostContext> = {},
): McpUiHostContext {
  return overrides as McpUiHostContext;
}

const CSS_PROPS = [
  '--mcp-container-height',
  '--mcp-container-width',
  '--mcp-safe-area-top',
  '--mcp-safe-area-right',
  '--mcp-safe-area-bottom',
  '--mcp-safe-area-left',
] as const;

afterEach(() => {
  delete document.documentElement.dataset.displayMode;
  CSS_PROPS.forEach((prop) =>
    document.documentElement.style.removeProperty(prop),
  );
});

describe('useHostLayout', () => {
  describe('displayMode → dataset.displayMode', () => {
    it('sets document.documentElement.dataset.displayMode when displayMode is provided', () => {
      const { rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useHostLayout(ctx),
        { initialProps: { ctx: makeHostContext({ displayMode: 'inline' }) } },
      );

      expect(document.documentElement.dataset.displayMode).toBe('inline');

      rerender({ ctx: makeHostContext({ displayMode: 'pip' }) });
      expect(document.documentElement.dataset.displayMode).toBe('pip');
    });

    it('removes dataset.displayMode when displayMode is undefined', () => {
      const { rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useHostLayout(ctx),
        { initialProps: { ctx: makeHostContext({ displayMode: 'inline' }) } },
      );

      expect(document.documentElement.dataset.displayMode).toBe('inline');

      rerender({ ctx: makeHostContext() });
      expect(document.documentElement.dataset.displayMode).toBeUndefined();
    });
  });

  describe('containerDimensions → CSS vars', () => {
    it('sets --mcp-container-height when containerDimensions.height is provided', () => {
      renderHook(() =>
        useHostLayout(
          makeHostContext({ containerDimensions: { height: 480, width: 320 } }),
        ),
      );

      expect(
        document.documentElement.style.getPropertyValue(
          '--mcp-container-height',
        ),
      ).toBe('480px');
    });

    it('removes --mcp-container-height when containerDimensions is undefined', () => {
      const { rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useHostLayout(ctx),
        {
          initialProps: {
            ctx: makeHostContext({
              containerDimensions: { height: 480, width: 320 },
            }),
          },
        },
      );

      expect(
        document.documentElement.style.getPropertyValue(
          '--mcp-container-height',
        ),
      ).toBe('480px');

      rerender({ ctx: makeHostContext() });
      expect(
        document.documentElement.style.getPropertyValue(
          '--mcp-container-height',
        ),
      ).toBe('');
    });

    it('sets --mcp-container-width when containerDimensions.width is provided', () => {
      renderHook(() =>
        useHostLayout(
          makeHostContext({ containerDimensions: { height: 480, width: 320 } }),
        ),
      );

      expect(
        document.documentElement.style.getPropertyValue(
          '--mcp-container-width',
        ),
      ).toBe('320px');
    });
  });

  describe('safeAreaInsets → CSS vars', () => {
    it('sets --mcp-safe-area-* when safeAreaInsets has positive values', () => {
      renderHook(() =>
        useHostLayout(
          makeHostContext({
            safeAreaInsets: { top: 44, right: 0, bottom: 34, left: 0 },
          }),
        ),
      );

      expect(
        document.documentElement.style.getPropertyValue('--mcp-safe-area-top'),
      ).toBe('44px');
      expect(
        document.documentElement.style.getPropertyValue(
          '--mcp-safe-area-bottom',
        ),
      ).toBe('34px');
    });

    it('removes --mcp-safe-area-top when the value is 0', () => {
      const { rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useHostLayout(ctx),
        {
          initialProps: {
            ctx: makeHostContext({
              safeAreaInsets: { top: 44, right: 0, bottom: 0, left: 0 },
            }),
          },
        },
      );

      expect(
        document.documentElement.style.getPropertyValue('--mcp-safe-area-top'),
      ).toBe('44px');

      rerender({
        ctx: makeHostContext({
          safeAreaInsets: { top: 0, right: 0, bottom: 0, left: 0 },
        }),
      });
      expect(
        document.documentElement.style.getPropertyValue('--mcp-safe-area-top'),
      ).toBe('');
    });

    it('removes --mcp-safe-area-top when safeAreaInsets is undefined', () => {
      const { rerender } = renderHook(
        ({ ctx }: { ctx: McpUiHostContext | undefined }) => useHostLayout(ctx),
        {
          initialProps: {
            ctx: makeHostContext({
              safeAreaInsets: { top: 44, right: 0, bottom: 0, left: 0 },
            }),
          },
        },
      );

      rerender({ ctx: makeHostContext() });
      expect(
        document.documentElement.style.getPropertyValue('--mcp-safe-area-top'),
      ).toBe('');
    });
  });

  describe('isFillHeight', () => {
    it('is false for displayMode "inline"', () => {
      const { result } = renderHook(() =>
        useHostLayout(makeHostContext({ displayMode: 'inline' })),
      );

      expect(result.current.isFillHeight).toBe(false);
    });

    it('is true for displayMode "pip"', () => {
      const { result } = renderHook(() =>
        useHostLayout(makeHostContext({ displayMode: 'pip' })),
      );

      expect(result.current.isFillHeight).toBe(true);
    });

    it('is true for displayMode "fullscreen"', () => {
      const { result } = renderHook(() =>
        useHostLayout(makeHostContext({ displayMode: 'fullscreen' })),
      );

      expect(result.current.isFillHeight).toBe(true);
    });
  });

  describe('locale', () => {
    it('returns locale from hostContext', () => {
      const { result } = renderHook(() =>
        useHostLayout(makeHostContext({ locale: 'uk' })),
      );

      expect(result.current.locale).toBe('uk');
    });

    it('returns undefined when locale is not set', () => {
      const { result } = renderHook(() => useHostLayout(makeHostContext()));

      expect(result.current.locale).toBeUndefined();
    });
  });
});
