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

  it('shows only the tabs for which attachment data is provided', () => {
    render(
      <DataView
        chartAttachment={chartAttachment()}
        crossDatasetGridAttachment={undefined}
        platform={Platform.Desktop}
        isFullscreen={false}
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

  it('defaults to the Grid tab when available and switches content when a tab is clicked', () => {
    render(
      <DataView
        chartAttachment={chartAttachment()}
        crossDatasetGridAttachment={gridAttachment()}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('grid-attachment')).toBeInTheDocument();
    expect(screen.queryByTestId('chart-view')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Chart' }));
    expect(screen.getByTestId('chart-view')).toBeInTheDocument();
    expect(screen.queryByTestId('grid-attachment')).not.toBeInTheDocument();
  });

  it('closes the side panel when switching away from the Grid tab, and not when switching to it', () => {
    render(
      <DataView
        chartAttachment={chartAttachment()}
        crossDatasetGridAttachment={gridAttachment()}
        platform={Platform.Desktop}
        isFullscreen={false}
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
        isFullscreen={false}
      />,
    );
    expect(document.documentElement.dataset.activeTab).toBe('grid');

    fireEvent.click(screen.getByRole('button', { name: 'Chart' }));
    expect(document.documentElement.dataset.activeTab).toBe('chart');

    unmount();
    expect(document.documentElement.dataset.activeTab).toBeUndefined();
  });

  it('passes fixHeight={!fillHeight} through to the grid attachment', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment()}
        platform={Platform.Desktop}
        isFullscreen={false}
        fillHeight
      />,
    );
    expect(screen.getByTestId('grid-attachment')).toHaveAttribute(
      'data-fix-height',
      'false',
    );
  });

  it('sets rowHeight/headerHeight to 32 on desktop, without a metadataColumnWidth', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment()}
        platform={Platform.Desktop}
        isFullscreen={false}
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
        isFullscreen={false}
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

  it('makes the grid wrapper fill its container height in fullscreen/pip (fillHeight), so the grid inside can still stretch via its own h-full', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(10)}
        platform={Platform.Desktop}
        isFullscreen
        fillHeight
      />,
    );
    const wrapper = screen.getByTestId('grid-row-cap-wrapper');
    expect(wrapper).toHaveClass('h-full');
    expect(wrapper).toHaveClass('min-h-0');
  });

  it('does not stretch the grid wrapper to fill height in inline mode', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(10)}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('grid-row-cap-wrapper')).not.toHaveClass(
      'h-full',
    );
  });

  it("sets the grid wrapper's --mcp-grid-max-height to header + 6 rows on desktop when there are more than 6 rows", () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(10)}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('grid-row-cap-wrapper')).toHaveStyle({
      '--mcp-grid-max-height': `${32 + 6 * 32}px`,
    });
  });

  it("sets the grid wrapper's --mcp-grid-max-height to header + 3 rows on mobile when there are more than 3 rows", () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(10)}
        platform={Platform.Mobile}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('grid-row-cap-wrapper')).toHaveStyle({
      '--mcp-grid-max-height': `${44 + 3 * 44}px`,
    });
  });

  it("sizes the grid wrapper's --mcp-grid-max-height to the actual row count when it's below the cap", () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(1)}
        platform={Platform.Mobile}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('grid-row-cap-wrapper')).toHaveStyle({
      '--mcp-grid-max-height': `${44 + 1 * 44}px`,
    });
  });

  it('shows the "Showing N of total results" footer with an Open full view button on mobile inline when rows exceed the cap', () => {
    const requestFullscreen = vi.fn();
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(12)}
        platform={Platform.Mobile}
        isFullscreen={false}
        canRequestFullscreen
        requestFullscreen={requestFullscreen}
      />,
    );
    expect(screen.getByText('Showing 3 of 12 results')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open full view' }));
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('hides the footer on mobile inline when total rows are at or below the cap', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(3)}
        platform={Platform.Mobile}
        isFullscreen={false}
        canRequestFullscreen
        requestFullscreen={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Open full view' }),
    ).not.toBeInTheDocument();
  });

  it('hides the footer on desktop even when rows exceed the cap', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(12)}
        platform={Platform.Desktop}
        isFullscreen={false}
        canRequestFullscreen
        requestFullscreen={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Open full view' }),
    ).not.toBeInTheDocument();
  });

  it('hides the footer in fillHeight (pip/fullscreen) mode even on mobile with rows exceeding the cap', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(12)}
        platform={Platform.Mobile}
        isFullscreen
        fillHeight
        canRequestFullscreen
        requestFullscreen={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Open full view' }),
    ).not.toBeInTheDocument();
  });

  it('hides the footer when fullscreen is not available, even if rows exceed the cap on mobile inline', () => {
    render(
      <DataView
        chartAttachment={undefined}
        crossDatasetGridAttachment={gridAttachment(12)}
        platform={Platform.Mobile}
        isFullscreen={false}
        canRequestFullscreen={false}
        requestFullscreen={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Open full view' }),
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
    const chart = chartAttachment();
    const { rerender } = render(
      <DataView
        chartAttachment={chart}
        crossDatasetGridAttachment={grid}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(gridRenderCount.current).toBe(1);

    rerender(
      <DataView
        chartAttachment={chart}
        crossDatasetGridAttachment={grid}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(gridRenderCount.current).toBe(1);
  });
});
