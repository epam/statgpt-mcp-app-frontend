import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DataView } from '../DataView';
import { Platform } from '../../host/hostContext';
import { ATTACHMENT_TYPE } from '../../constants/attachmentTypes';
import type {
  ChartAttachment,
  CrossDatasetGridAttachmentData,
} from '../../types/attachments';

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
  }) => {
    gridRenderCount.current += 1;
    return (
      <div
        data-testid="grid-attachment"
        data-fix-height={String(props.fixHeight)}
        data-row-height={String(props.rowHeight)}
        data-header-height={String(props.headerHeight)}
        data-metadata-column-width={String(props.metadataColumnWidth)}
      />
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
    it('renders only the chart, no tab bar, when chart data is available', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={gridAttachment(10)}
          pythonCode="print(1)"
          platform={Platform.Desktop}
          isFullscreen={false}
        />,
      );
      expect(screen.getByTestId('chart-view')).toBeInTheDocument();
      expect(screen.queryByTestId('grid-attachment')).not.toBeInTheDocument();
      expect(screen.queryByTestId('code-attachment')).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Grid' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Chart' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: 'Code' }),
      ).not.toBeInTheDocument();
    });

    it('shows the chart-available caption and an "Explore the data" button that requests fullscreen', () => {
      const requestFullscreen = vi.fn();
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={undefined}
          platform={Platform.Desktop}
          isFullscreen={false}
          canRequestFullscreen
          requestFullscreen={requestFullscreen}
        />,
      );
      expect(
        screen.getByText(
          'You\'re looking at a chart summary of the result. The generated data table is available in the chat response. You can see a more detailed table in the advanced view by going into "Explore the data".',
        ),
      ).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Explore the data' }));
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
    });

    it('renders no chart/grid and shows the no-chart caption when chart data is unavailable', () => {
      const requestFullscreen = vi.fn();
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={gridAttachment(10)}
          platform={Platform.Desktop}
          isFullscreen={false}
          canRequestFullscreen
          requestFullscreen={requestFullscreen}
        />,
      );
      expect(
        screen.getByText(
          "This result doesn't have a chart to show. The full data table and the code that produced it are available in the detailed view.",
        ),
      ).toBeInTheDocument();
      expect(screen.queryByTestId('chart-view')).not.toBeInTheDocument();
      expect(screen.queryByTestId('grid-attachment')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Explore the data' }));
      expect(requestFullscreen).toHaveBeenCalledTimes(1);
    });

    it("sets document.documentElement.dataset.activeTab to 'chart' when chart data is available, and clears it on unmount", () => {
      const { unmount } = render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={undefined}
          platform={Platform.Desktop}
          isFullscreen={false}
        />,
      );
      expect(document.documentElement.dataset.activeTab).toBe('chart');
      unmount();
      expect(document.documentElement.dataset.activeTab).toBeUndefined();
    });

    it("sets document.documentElement.dataset.activeTab to 'no-chart' when chart data is unavailable", () => {
      render(
        <DataView
          chartAttachment={undefined}
          crossDatasetGridAttachment={gridAttachment(10)}
          platform={Platform.Desktop}
          isFullscreen={false}
        />,
      );
      expect(document.documentElement.dataset.activeTab).toBe('no-chart');
    });

    it('hides the inline header (caption + button) entirely when fullscreen cannot be requested', () => {
      render(
        <DataView
          chartAttachment={chartAttachment()}
          crossDatasetGridAttachment={undefined}
          platform={Platform.Desktop}
          isFullscreen={false}
          canRequestFullscreen={false}
        />,
      );
      expect(
        screen.queryByRole('button', { name: 'Explore the data' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(
          'You\'re looking at a chart summary of the result. The generated data table is available in the chat response. You can see a more detailed table in the advanced view by going into "Explore the data".',
        ),
      ).not.toBeInTheDocument();
      expect(screen.getByTestId('chart-view')).toBeInTheDocument();
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
});
