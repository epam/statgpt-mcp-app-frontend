import { renderHook, act } from '@testing-library/react';
import { DataQueryStatus } from '../../bridge/types';
import { EmptyStateKind } from '../../bridge/emptyState';

describe('useSdmxData', () => {
  describe('production mode', () => {
    let useSdmxData: () => import('../useSdmxData').SdmxData;
    let mockCallTool: ReturnType<typeof vi.fn>;
    let currentSnapshot: import('../../bridge/types').BridgeSnapshot;

    const validToolResult = {
      version: 2 as const,
      status: DataQueryStatus.DataAvailable,
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
        toolResultReceived: false,
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
      currentSnapshot = {
        phase: 'connecting',
        toolResult: null,
        toolResultReceived: false,
      };
      const { result } = renderHook(() => useSdmxData());
      expect(result.current.loading).toBe(false);
    });

    it('calls bridge.callTool when phase becomes "ready" and fetchKey is non-empty', async () => {
      mockCallTool.mockResolvedValue({});

      currentSnapshot = {
        phase: 'ready',
        toolResult: validToolResult,
        toolResultReceived: true,
      };

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

      currentSnapshot = {
        phase: 'ready',
        toolResult: validToolResult,
        toolResultReceived: true,
      };

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

      currentSnapshot = {
        phase: 'ready',
        toolResult: validToolResult,
        toolResultReceived: true,
      };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(result.current.error).toBe('network failure');
      expect(result.current.loading).toBe(false);
      consoleError.mockRestore();
    });

    it('calls bridge.callTool for a schema-v1 payload with no status field at all', async () => {
      mockCallTool.mockResolvedValue({});
      const { status: _status, version: _version, ...rest } = validToolResult;
      const v1ToolResult = { ...rest, version: 1 as const };

      currentSnapshot = {
        phase: 'ready',
        toolResult: v1ToolResult,
        toolResultReceived: true,
      };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCallTool).toHaveBeenCalledWith(
        'sdmx_proxy',
        expect.objectContaining({ path: expect.any(String) }),
      );
      expect(result.current.emptyState).toBeNull();
    });

    it('does not call bridge.callTool for a schema-v2 payload missing status (likely a bug, not v1)', async () => {
      const { status: _status, ...rest } = validToolResult;

      currentSnapshot = {
        phase: 'ready',
        toolResult: rest,
        toolResultReceived: true,
      };

      renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('does not call bridge.callTool when status is not "data_available"', async () => {
      currentSnapshot = {
        phase: 'ready',
        toolResult: {
          ...validToolResult,
          status: DataQueryStatus.ExecutedNoData,
        },
        toolResultReceived: true,
      };

      renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('returns a "text" emptyState with the resolved message when status is "no_data"', async () => {
      currentSnapshot = {
        phase: 'ready',
        toolResult: {
          status: DataQueryStatus.NoData,
          queries: [],
          tools: { sdmxProxy: 'sdmx_proxy' },
          message: 'No relevant data found for the query.',
        },
        toolResultReceived: true,
      };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.emptyState).toEqual({
        kind: EmptyStateKind.Text,
        message: 'No relevant data found for the query.',
        tabs: [],
      });
    });

    it('returns an "error" emptyState when status is "failed"', async () => {
      currentSnapshot = {
        phase: 'ready',
        toolResult: {
          status: DataQueryStatus.Failed,
          queries: [],
          tools: { sdmxProxy: 'sdmx_proxy' },
        },
        toolResultReceived: true,
        toolResultText: 'The following queries were executed...',
      };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.emptyState).toEqual({
        kind: EmptyStateKind.Error,
        message: 'The following queries were executed...',
        tabs: [],
      });
      expect(mockCallTool).not.toHaveBeenCalled();
    });

    it('returns emptyState with the default fallback when there is no structuredContent at all', async () => {
      currentSnapshot = {
        phase: 'ready',
        toolResult: null,
        toolResultReceived: true,
      };

      const { result } = renderHook(() => useSdmxData());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.emptyState).toEqual({
        kind: EmptyStateKind.Text,
        message:
          'No data was found for the provided query. Try to change the query.',
        tabs: [],
      });
    });

    describe('window.openai widget state', () => {
      afterEach(() => {
        delete (window as unknown as { openai?: unknown }).openai;
      });

      it('persists meta via window.openai.setWidgetState when a full tool-result arrives', async () => {
        const setWidgetState = vi.fn();
        (window as unknown as { openai?: unknown }).openai = {
          setWidgetState,
        };
        mockCallTool.mockResolvedValue({});

        currentSnapshot = {
          phase: 'ready',
          toolResult: validToolResult,
          toolResultReceived: true,
        };

        renderHook(() => useSdmxData());

        await act(async () => {
          await Promise.resolve();
        });

        expect(setWidgetState).toHaveBeenCalledWith(
          expect.objectContaining({
            queries: validToolResult.queries,
            sdmxProxyToolName: 'sdmx_proxy',
          }),
        );
      });

      it('does not throw when window.openai is undefined and a full tool-result arrives', async () => {
        delete (window as unknown as { openai?: unknown }).openai;
        mockCallTool.mockResolvedValue({});

        currentSnapshot = {
          phase: 'ready',
          toolResult: validToolResult,
          toolResultReceived: true,
        };

        expect(() => renderHook(() => useSdmxData())).not.toThrow();

        await act(async () => {
          await Promise.resolve();
        });
      });

      it('falls back to window.openai.widgetState when tool-result is missing queries/tools.sdmxProxy', async () => {
        mockCallTool.mockResolvedValue({});
        (window as unknown as { openai?: unknown }).openai = {
          widgetState: {
            status: DataQueryStatus.DataAvailable,
            queries: validToolResult.queries,
            sdmxProxyToolName: 'sdmx_proxy',
          },
        };

        currentSnapshot = {
          phase: 'ready',
          toolResult: { status: DataQueryStatus.DataAvailable, version: 2 },
          toolResultReceived: true,
        };

        const { result } = renderHook(() => useSdmxData());

        await act(async () => {
          await Promise.resolve();
        });

        expect(mockCallTool).toHaveBeenCalledWith(
          'sdmx_proxy',
          expect.objectContaining({ path: expect.any(String) }),
        );
        expect(result.current.emptyState).toBeNull();
      });

      it('shows the empty state when tool-result is incomplete and window.openai.widgetState has nothing usable', async () => {
        (window as unknown as { openai?: unknown }).openai = {};

        currentSnapshot = {
          phase: 'ready',
          toolResult: { status: DataQueryStatus.DataAvailable, version: 2 },
          toolResultReceived: true,
        };

        const { result } = renderHook(() => useSdmxData());

        await act(async () => {
          await Promise.resolve();
        });

        expect(mockCallTool).not.toHaveBeenCalled();
        expect(result.current.emptyState).toEqual({
          kind: EmptyStateKind.Text,
          message:
            'No data was found for the provided query. Try to change the query.',
          tabs: [],
        });
      });
    });
  });
});
