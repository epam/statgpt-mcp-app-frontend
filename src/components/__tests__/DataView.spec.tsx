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
  CrossDatasetGridAttachment: (props: { fixHeight?: boolean }) => {
    gridRenderCount.current += 1;
    return (
      <div
        data-testid="grid-attachment"
        data-fix-height={String(props.fixHeight)}
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

function gridAttachment(): CrossDatasetGridAttachmentData {
  return { data: [], columns: [] };
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
