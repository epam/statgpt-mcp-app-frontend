import { act, render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DataView } from '../DataView';
import { Platform } from '../../host/hostContext';
import { ATTACHMENT_TYPE } from '../../constants/attachmentTypes';
import type {
  ChartAttachment,
  CrossDatasetGridAttachmentData,
} from '../../types/attachments';

/**
 * Triggerable, but a no-op unless a test explicitly calls `.trigger(width)`
 * — every test that doesn't care about the measured width behaves exactly
 * as if this were a plain no-op stub.
 */
class TriggerableResizeObserver {
  static instances: TriggerableResizeObserver[] = [];
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    TriggerableResizeObserver.instances.push(this);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  trigger(width: number) {
    this.callback(
      [{ contentRect: { width } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}
(
  window as unknown as { ResizeObserver: typeof ResizeObserver }
).ResizeObserver =
  TriggerableResizeObserver as unknown as typeof ResizeObserver;

const { mockClosePanel, gridRenderCount } = vi.hoisted(() => ({
  mockClosePanel: vi.fn(),
  gridRenderCount: { current: 0 },
}));

vi.mock('@epam/statgpt-conversation-view', () => ({
  CrossDatasetGridAttachment: (props: {
    fixHeight?: boolean;
    rowHeight?: number;
    headerHeight?: number;
    metadataColumnWidth?: number;
    attachment?: { gridContent?: { data?: unknown[] } };
  }) => {
    gridRenderCount.current += 1;
    return (
      <div
        data-testid="grid-attachment"
        data-fix-height={String(props.fixHeight)}
        data-row-height={String(props.rowHeight)}
        data-header-height={String(props.headerHeight)}
        data-metadata-column-width={String(props.metadataColumnWidth)}
        data-row-count={String(
          props.attachment?.gridContent?.data?.length ?? 0,
        )}
      >
        {/* Stands in for AG Grid's real scrollable viewport — DataView
            navigates by setting this element's `scrollLeft` directly. */}
        <div className="ag-center-cols-viewport" />
      </div>
    );
  },
  useConversationViewSidePanelOptional: () => ({
    closePanel: mockClosePanel,
  }),
}));

vi.mock('../Chart/ChartView', () => ({
  ChartView: () => <div data-testid="chart-view" />,
}));

vi.mock('../CodeAttachment', () => ({
  CodeAttachment: () => <div data-testid="code-attachment" />,
}));

function gridAttachment(rowCount = 0): CrossDatasetGridAttachmentData {
  return { data: Array.from({ length: rowCount }, () => ({})), columns: [] };
}

function columnsFixture() {
  return [
    { colId: 'agency', field: 'agency', flex: 1, minWidth: 200 },
    { colId: '2010', field: '2010', width: 200 },
    { colId: '2011', field: '2011', width: 200 },
  ];
}

function chartAttachment(): ChartAttachment {
  return { type: ATTACHMENT_TYPE.CUSTOM_CHART, title: 'Chart' };
}

describe('DataView', () => {
  beforeEach(() => {
    mockClosePanel.mockClear();
    gridRenderCount.current = 0;
    delete document.documentElement.dataset.activeTab;
  });

  it('renders nothing when no attachment or pythonCode is provided', () => {
    const { container } = render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={undefined}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  describe('inline mode (fillHeight not set)', () => {
    it("sets document.documentElement.dataset.activeTab to 'grid' when grid data is available inline, and clears it on unmount", () => {
      const { unmount } = render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={gridAttachment(10)}
          platform={Platform.Desktop}
          isFullscreen={false}
        />,
      );
      expect(document.documentElement.dataset.activeTab).toBe('grid');
      unmount();
      expect(document.documentElement.dataset.activeTab).toBeUndefined();
    });

    it("sets document.documentElement.dataset.activeTab to 'no-grid' when no grid data is available inline", () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={undefined}
          platform={Platform.Desktop}
          isFullscreen={false}
        />,
      );
      expect(document.documentElement.dataset.activeTab).toBe('no-grid');
    });
  });

  describe('pip/fullscreen mode (fillHeight set)', () => {
    it('shows only the tabs for which attachment data is provided', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={undefined}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByRole('button', { name: 'Chart' })).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Grid' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Code' }),
      ).not.toBeInTheDocument();
    });

    it('defaults to the Grid tab when available, and switches content when a tab is clicked', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={gridAttachment()}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByTestId('grid-attachment')).toBeInTheDocument();
      expect(screen.queryByTestId('chart-view')).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Chart' }));
      expect(screen.getByTestId('chart-view')).toBeInTheDocument();
      expect(screen.queryByTestId('grid-attachment')).not.toBeInTheDocument();
    });

    it('defaults to the Chart tab when no grid is available', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={undefined}
          pythonCode="print(1)"
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByTestId('chart-view')).toBeInTheDocument();
      expect(screen.queryByTestId('code-attachment')).not.toBeInTheDocument();
    });

    it('closes the side panel when switching away from the Grid tab, and not when switching to it', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={gridAttachment()}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(mockClosePanel).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: 'Chart' }));
      expect(mockClosePanel).toHaveBeenCalledTimes(1);

      mockClosePanel.mockClear();
      fireEvent.click(screen.getByRole('button', { name: 'Grid' }));
      expect(mockClosePanel).not.toHaveBeenCalled();
    });

    it('writes the active tab to document.documentElement.dataset.activeTab and clears it on unmount', () => {
      const { unmount } = render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={gridAttachment()}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(document.documentElement.dataset.activeTab).toBe('grid');

      fireEvent.click(screen.getByRole('button', { name: 'Chart' }));
      expect(document.documentElement.dataset.activeTab).toBe('chart');

      unmount();
      expect(document.documentElement.dataset.activeTab).toBeUndefined();
    });

    it('renders the grid attachment directly with fixHeight false, no row-cap wrapper', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={gridAttachment(10)}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-fix-height',
        'false',
      );
      expect(
        screen.queryByTestId('grid-row-cap-wrapper'),
      ).not.toBeInTheDocument();
    });

    it('sets rowHeight/headerHeight to 32 on desktop, without a metadataColumnWidth', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={gridAttachment()}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-row-height',
        '32',
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-header-height',
        '32',
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-metadata-column-width',
        'undefined',
      );
    });

    it('sets rowHeight/headerHeight/metadataColumnWidth to 44 on the grid attachment on mobile', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={gridAttachment()}
          platform={Platform.Mobile}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-row-height',
        '44',
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-header-height',
        '44',
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-metadata-column-width',
        '44',
      );
    });

    it('never shows the inline "Explore the data" button', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={gridAttachment()}
          pythonCode="print(1)"
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Explore the data' }),
      ).not.toBeInTheDocument();
    });

    /**
     * `chart`/`grid` keep the same object references across both renders,
     * matching what the memoized `useDataAttachments`/`useChartTheme` hooks
     * already provide in production — simulating a parent re-render for an
     * unrelated reason.
     */
    it('does not re-render the grid attachment when re-rendered with unchanged attachment props', () => {
      const grid = gridAttachment();
      const { rerender } = render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={grid}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(gridRenderCount.current).toBe(1);

      rerender(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={grid}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(gridRenderCount.current).toBe(1);
    });
  });

  describe('DataView inline grid', () => {
    it('renders the grid inline, sliced to the desktop row cap, instead of the chart', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{
            data: Array.from({ length: 10 }, (_, i) => ({ id: i })),
            columns: columnsFixture(),
          }}
          platform={Platform.Desktop}
          isFullscreen={false}
          fillHeight={false}
        />,
      );
      const grid = screen.getByTestId('grid-attachment');
      expect(grid).toBeInTheDocument();
      expect(screen.queryByTestId('chart-view')).not.toBeInTheDocument();
    });

    it('shows the row-limit footer when total rows exceed the cap and fullscreen can be requested', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{
            data: Array.from({ length: 10 }, (_, i) => ({ id: i })),
            columns: columnsFixture(),
          }}
          platform={Platform.Desktop}
          isFullscreen={false}
          fillHeight={false}
          canRequestFullscreen
          requestFullscreen={() => {}}
        />,
      );
      expect(screen.getByText('Showing 6 of 10 results')).toBeInTheDocument();
    });

    it('still shows the row-limit footer when total rows are within the cap, with the actual displayed count', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{
            data: Array.from({ length: 3 }, (_, i) => ({ id: i })),
            columns: columnsFixture(),
          }}
          platform={Platform.Desktop}
          isFullscreen={false}
          fillHeight={false}
          canRequestFullscreen
          requestFullscreen={() => {}}
        />,
      );
      expect(screen.getByText('Showing 3 of 3 results')).toBeInTheDocument();
    });

    it('leaves pip/fullscreen (fillHeight) rendering the full, unsliced grid via Tabs', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{
            data: Array.from({ length: 10 }, (_, i) => ({ id: i })),
            columns: columnsFixture(),
          }}
          platform={Platform.Desktop}
          isFullscreen
          fillHeight
        />,
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-row-count',
        '10',
      );
    });

    it('slices to the row cap in genuine inline mode, not the full row count', () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{
            data: Array.from({ length: 10 }, (_, i) => ({ id: i })),
            columns: columnsFixture(),
          }}
          platform={Platform.Desktop}
          isFullscreen={false}
          fillHeight={false}
        />,
      );
      expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
        'data-row-count',
        '6',
      );
    });
  });

  describe('scroll-based column carousel navigation', () => {
    // agency (220, identity) + 2010 (130) + 2011 (130) = 480px total. At a
    // measured 300px viewport, 'agency' alone fits page 1 (adding '2010'
    // would be 350 > 300); page 2's raw boundary is 220, but desktop
    // rewinds every page after the first by min(30, previous column
    // width) = min(30, 220) = 30, landing at 220 - 30 = 190.
    beforeEach(() => {
      TriggerableResizeObserver.instances = [];
    });

    it("scrolls the grid's real viewport to the next page's offset when the next-slide arrow is clicked", () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{
            data: [{ id: 1 }],
            columns: columnsFixture(),
          }}
          platform={Platform.Desktop}
          isFullscreen={false}
          fillHeight={false}
        />,
      );
      act(() => {
        TriggerableResizeObserver.instances[0].trigger(300);
      });

      const scrollEl = document.querySelector(
        '.ag-center-cols-viewport',
      ) as HTMLElement;
      expect(scrollEl.scrollLeft).toBe(0);

      fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
      expect(scrollEl.scrollLeft).toBe(190);

      fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
      expect(scrollEl.scrollLeft).toBe(0);
    });
  });

  describe('mobile page layout stability', () => {
    beforeEach(() => {
      TriggerableResizeObserver.instances = [];
    });

    it("reserves the nudge column's width out of the measured grid width unconditionally, so the page layout doesn't depend on which slide is active", () => {
      // 3 equal 130px value columns, measured at 285px: the nudge column's
      // 32px must always come out of that budget (not just when it happens
      // to be mounted), or this would land on 2 pages ([0, 260]: 'a'+'b'
      // fit together in a raw 285px budget) instead of the correct 3
      // ([0, 130, 260]: only 'a' fits once 32px is reserved, same as if the
      // nudge column were actually taking up space).
      const cols = [
        { colId: 'a', field: 'a', width: 130 },
        { colId: 'b', field: 'b', width: 130 },
        { colId: 'c', field: 'c', width: 130 },
      ];
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={{ data: [{ id: 1 }], columns: cols }}
          platform={Platform.Mobile}
          isFullscreen={false}
          fillHeight={false}
        />,
      );
      act(() => {
        TriggerableResizeObserver.instances[0].trigger(285);
      });

      const grid = document.querySelector('.mcp-grid-carousel') as HTMLElement;
      const scrollEl = document.querySelector(
        '.ag-center-cols-viewport',
      ) as HTMLElement;
      expect(scrollEl.scrollLeft).toBe(0);

      const swipeNext = () => {
        fireEvent.pointerDown(grid, { clientX: 300, clientY: 100 });
        fireEvent.pointerMove(grid, { clientX: 200, clientY: 100 });
        fireEvent.pointerUp(grid, { clientX: 200, clientY: 100 });
      };

      swipeNext();
      expect(scrollEl.scrollLeft).toBe(130);

      swipeNext();
      expect(scrollEl.scrollLeft).toBe(260);
    });
  });
});
