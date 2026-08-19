import { forwardRef, useImperativeHandle } from 'react';
import type { Ref } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ChartUnit, ChartingData } from '@epam/statgpt-conversation-view';
import { Platform } from '../../../host/hostContext';
import type { ChartAttachment } from '../../../types/attachments';
import { ATTACHMENT_TYPE } from '../../../constants/attachmentTypes';
import { ChartView } from '../ChartView';

const { dispatchActionMock } = vi.hoisted(() => ({
  dispatchActionMock: vi.fn(),
}));

vi.mock('echarts-for-react', () => ({
  default: forwardRef(function MockReactECharts(
    { option }: { option: unknown },
    ref: Ref<{
      getEchartsInstance: () => {
        resize: () => void;
        dispatchAction: typeof dispatchActionMock;
      };
    }>,
  ) {
    useImperativeHandle(ref, () => ({
      getEchartsInstance: () => ({
        resize: vi.fn(),
        dispatchAction: dispatchActionMock,
      }),
    }));
    return <div data-testid="mock-chart">{JSON.stringify(option)}</div>;
  }),
}));

function makeUnit(overrides: Partial<ChartUnit> = {}): ChartUnit {
  return {
    rows: [],
    config: { title: { text: 'unit' } },
    dimensions: [{ id: 'freq', title: 'Frequency', value: 'Annual' }],
    limitedByRowsAmountTo: undefined,
    isPlottable: true,
    ...overrides,
  };
}

function makeAttachment(chartingData: ChartingData): ChartAttachment {
  return {
    type: ATTACHMENT_TYPE.CUSTOM_CHART,
    title: 'Chart',
    charting_data: chartingData,
  };
}

describe('ChartView', () => {
  it('renders nothing when there are no chart units', () => {
    const { container } = render(
      <ChartView
        attachment={makeAttachment({ units: [] })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the first unit by default', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [makeUnit({ config: { title: { text: 'first' } } })],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('mock-chart')).toHaveTextContent('first');
  });

  it('renders the current unit dimensions', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({
              dimensions: [{ id: 'unit', title: 'Unit', value: 'Euro' }],
            }),
          ],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByText('Unit:')).toBeInTheDocument();
    expect(screen.getByText('Euro')).toBeInTheDocument();
  });

  it('always shows the "Chart: X/Y" label, even for a single unit', () => {
    render(
      <ChartView
        attachment={makeAttachment({ units: [makeUnit()] })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByText('Chart: 1/1')).toBeInTheDocument();
  });

  it('does not render either pager for a single chart unit', () => {
    render(
      <ChartView
        attachment={makeAttachment({ units: [makeUnit()] })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.queryByText('1/1')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next chart' }),
    ).not.toBeInTheDocument();
  });

  it('renders both the label-less top pager and the labeled bottom pager for multiple units', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [makeUnit(), makeUnit()],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Next chart' })).toHaveLength(
      2,
    );
  });

  it('advances to the next chart unit via either pager', async () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({ config: { title: { text: 'first' } } }),
            makeUnit({ config: { title: { text: 'second' } } }),
          ],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('mock-chart')).toHaveTextContent('first');
    const [nextButton] = screen.getAllByRole('button', { name: 'Next chart' });
    await userEvent.click(nextButton);
    expect(screen.getByTestId('mock-chart')).toHaveTextContent('second');
    expect(screen.getByText('Chart: 2/2')).toBeInTheDocument();
  });

  it("hides ECharts' own legend rendering", () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [makeUnit({ config: { legend: { top: 0 } } })],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('mock-chart')).toHaveTextContent(
      '"legend":{"top":0,"show":false}',
    );
  });

  it('renders a DOM legend item per named series', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({
              config: {
                series: [{ name: 'Exports' }, { name: 'Imports' }],
              },
            }),
          ],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByRole('button', { name: 'Exports' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Imports' })).toBeInTheDocument();
  });

  it('toggles a series on the chart instance when its legend item is clicked', async () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [makeUnit({ config: { series: [{ name: 'Exports' }] } })],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Exports' }));
    expect(dispatchActionMock).toHaveBeenCalledWith({
      type: 'legendToggleSelect',
      name: 'Exports',
    });
  });

  it('flattens grouped units and shows the group title', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [],
          groups: [{ title: 'USA', units: [makeUnit()] }],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByText('USA')).toBeInTheDocument();
  });

  it('applies transformOption with the platform-derived isMobile flag', () => {
    const transformOption = vi.fn((option) => ({
      ...(option as object),
      transformed: true,
    }));
    render(
      <ChartView
        attachment={makeAttachment({ units: [makeUnit()] })}
        platform={Platform.Mobile}
        isFullscreen={false}
        transformOption={transformOption}
      />,
    );
    expect(transformOption).toHaveBeenCalledWith(expect.any(Object), {
      isMobile: true,
    });
    expect(screen.getByTestId('mock-chart')).toHaveTextContent('transformed');
  });

  it('resets to the first chart unit when the attachment changes', async () => {
    const { rerender } = render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({ config: { title: { text: 'a1' } } }),
            makeUnit({ config: { title: { text: 'a2' } } }),
          ],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    const [nextButton] = screen.getAllByRole('button', { name: 'Next chart' });
    await userEvent.click(nextButton);
    expect(screen.getByTestId('mock-chart')).toHaveTextContent('a2');

    rerender(
      <ChartView
        attachment={makeAttachment({
          units: [makeUnit({ config: { title: { text: 'b1' } } })],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    expect(screen.getByTestId('mock-chart')).toHaveTextContent('b1');
  });

  it('gives the dimensions list a fixed 220px column in fullscreen', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({
              dimensions: [{ id: 'unit', title: 'Unit', value: 'Euro' }],
            }),
          ],
        })}
        platform={Platform.Desktop}
        isFullscreen
        fillHeight
      />,
    );
    const dimensionsList = screen.getByText('Unit:').closest('div.flex-col');
    expect(dimensionsList).toHaveClass('w-[220px]');
  });

  it('stacks the dimensions list under the chart (no fixed column) outside fullscreen', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({
              dimensions: [{ id: 'unit', title: 'Unit', value: 'Euro' }],
            }),
          ],
        })}
        platform={Platform.Desktop}
        isFullscreen={false}
      />,
    );
    const dimensionsList = screen.getByText('Unit:').closest('div.flex-col');
    expect(dimensionsList).not.toHaveClass('w-[220px]');
  });

  it('stacks the dimensions list under the chart (no fixed column) in fullscreen on mobile', () => {
    render(
      <ChartView
        attachment={makeAttachment({
          units: [
            makeUnit({
              dimensions: [{ id: 'unit', title: 'Unit', value: 'Euro' }],
            }),
          ],
        })}
        platform={Platform.Mobile}
        isFullscreen
        fillHeight
      />,
    );
    const dimensionsList = screen.getByText('Unit:').closest('div.flex-col');
    expect(dimensionsList).not.toHaveClass('w-[220px]');
  });
});
