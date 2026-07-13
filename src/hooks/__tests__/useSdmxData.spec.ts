import { renderHook, act } from '@testing-library/react';
import { mockMeta } from '../../mocks/sdmxData';

describe('useSdmxData', () => {
  describe('dev mode', () => {
    let useSdmxData: () => import('../useSdmxData').SdmxData;

    beforeAll(async () => {
      ({ useSdmxData } = await import('../useSdmxData'));
    });

    it('returns loading: false', () => {
      const { result } = renderHook(() => useSdmxData());
      expect(result.current.loading).toBe(false);
    });

    it('returns error: null', () => {
      const { result } = renderHook(() => useSdmxData());
      expect(result.current.error).toBeNull();
    });

    it('returns the mock meta', () => {
      const { result } = renderHook(() => useSdmxData());
      expect(result.current.meta).toEqual(mockMeta);
    });

    it('returns snapshot.phase as "ready"', () => {
      const { result } = renderHook(() => useSdmxData());
      expect(result.current.snapshot.phase).toBe('ready');
    });
  });

  describe('production mode', () => {
    let useSdmxData: () => import('../useSdmxData').SdmxData;
    let mockCallTool: ReturnType<typeof vi.fn>;
    let currentSnapshot: import('../../bridge/types').BridgeSnapshot;

    const validToolResult = {
      queries: [
        {
          urn: 'IMF:BOP(1.0)',
          filters: [
            { componentCode: 'COUNTRY', operator: 'in', values: ['A'] },
          ],
          metadata: {
            countryDimension: 'COUNTRY',
            indicatorDimensions: [],
            keyDimensionIdsInDsdOrder: ['COUNTRY'],
          },
        },
      ],
      tools: { sdmxProxy: 'sdmx_proxy' },
    };

    beforeEach(async () => {
      mockCallTool = vi.fn();
      currentSnapshot = {
        phase: 'connecting',
        toolResult: null,
      };

      Object.defineProperty(window, 'parent', {
        get: () => ({}),
        configurable: true,
      });

      vi.resetModules();

      vi.doMock('../../bridge', () => ({
        bridge: {
          subscribe: vi.fn(() => () => {}),
          getSnapshot: vi.fn(() => currentSnapshot),
          callTool: mockCallTool,
        },
      }));

      vi.doMock('../../bridge/useBridge', () => ({
        useBridgeSnapshot: () => currentSnapshot,
      }));

      ({ useSdmxData } = await import('../useSdmxData'));
    });

    afterEach(() => {
      Object.defineProperty(window, 'parent', {
        get: () => window,
        configurable: true,
      });
      vi.resetModules();
      vi.clearAllMocks();
    });

    it('returns loading: false when phase is "connecting" and there is no toolResult', () => {
      currentSnapshot = { phase: 'connecting', toolResult: null };
      const { result } = renderHook(() => useSdmxData());
      expect(result.current.loading).toBe(false);
    });

    it('calls bridge.callTool when phase becomes "ready" and fetchKey is non-empty', async () => {
      mockCallTool.mockResolvedValue({});

      currentSnapshot = { phase: 'ready', toolResult: validToolResult };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCallTool).toHaveBeenCalledWith(
        'sdmx_proxy',
        expect.objectContaining({ path: expect.any(String) }),
      );
      expect(result.current).toBeDefined();
    });

    it('sets loading: true while bridge.callTool is in progress', async () => {
      let resolveCall: (v: unknown) => void;
      mockCallTool.mockReturnValue(
        new Promise((r) => {
          resolveCall = r;
        }),
      );

      currentSnapshot = { phase: 'ready', toolResult: validToolResult };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolveCall!({});
        await Promise.resolve();
      });
    });

    it('sets error when bridge.callTool rejects', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockCallTool.mockRejectedValue(new Error('network failure'));

      currentSnapshot = { phase: 'ready', toolResult: validToolResult };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.error).toBe('network failure');
      expect(result.current.loading).toBe(false);
      consoleError.mockRestore();
    });
  });
});
