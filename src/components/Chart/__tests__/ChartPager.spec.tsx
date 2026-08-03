import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Platform } from '../../../host/hostContext';
import { ChartPager } from '../ChartPager';

describe('ChartPager', () => {
  it('renders nothing when there is only one chart unit', () => {
    const { container } = render(
      <ChartPager
        currentIndex={0}
        totalCount={1}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        platform={Platform.Desktop}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the current position label', () => {
    render(
      <ChartPager
        currentIndex={1}
        totalCount={3}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        platform={Platform.Desktop}
      />,
    );
    expect(screen.getByText('2/3')).toBeInTheDocument();
  });

  it('calls onNext when the next button is clicked', async () => {
    const onNext = vi.fn();
    render(
      <ChartPager
        currentIndex={0}
        totalCount={3}
        onPrev={vi.fn()}
        onNext={onNext}
        platform={Platform.Desktop}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next chart' }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('calls onPrev when the previous button is clicked', async () => {
    const onPrev = vi.fn();
    render(
      <ChartPager
        currentIndex={1}
        totalCount={3}
        onPrev={onPrev}
        onNext={vi.fn()}
        platform={Platform.Desktop}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Previous chart' }),
    );
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('does not call onPrev when already at the first chart', async () => {
    const onPrev = vi.fn();
    render(
      <ChartPager
        currentIndex={0}
        totalCount={3}
        onPrev={onPrev}
        onNext={vi.fn()}
        platform={Platform.Desktop}
      />,
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Previous chart' }),
    );
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('does not call onNext when already at the last chart', async () => {
    const onNext = vi.fn();
    render(
      <ChartPager
        currentIndex={2}
        totalCount={3}
        onPrev={vi.fn()}
        onNext={onNext}
        platform={Platform.Desktop}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Next chart' }));
    expect(onNext).not.toHaveBeenCalled();
  });

  it('gives its buttons a border by default', () => {
    render(
      <ChartPager
        currentIndex={0}
        totalCount={3}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        platform={Platform.Desktop}
      />,
    );
    expect(screen.getByRole('button', { name: 'Next chart' })).toHaveClass(
      'border',
    );
  });

  it('hides the label but keeps the button border when showLabel is false', () => {
    render(
      <ChartPager
        currentIndex={0}
        totalCount={3}
        onPrev={vi.fn()}
        onNext={vi.fn()}
        platform={Platform.Desktop}
        showLabel={false}
      />,
    );
    expect(screen.queryByText('1/3')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next chart' })).toHaveClass(
      'border',
    );
  });
});
