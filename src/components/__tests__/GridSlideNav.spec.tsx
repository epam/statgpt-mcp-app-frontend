import { render, screen, fireEvent } from '@testing-library/react';
import { GridSlideNav } from '../GridSlideNav';
import { Platform } from '../../host/hostContext';

describe('GridSlideNav', () => {
  it('renders nothing when there is only one slide and nothing beyond it', () => {
    const { container } = render(
      <GridSlideNav
        activeSlide={0}
        slideCount={1}
        hasMoreBeyondSlides={false}
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows only a next arrow on the first of several slides, when showArrows is true', () => {
    render(
      <GridSlideNav
        activeSlide={0}
        slideCount={3}
        hasMoreBeyondSlides={false}
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Previous slide' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next slide' }),
    ).toBeInTheDocument();
  });

  it('shows both arrows on a middle slide', () => {
    render(
      <GridSlideNav
        activeSlide={1}
        slideCount={3}
        hasMoreBeyondSlides={false}
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.getByRole('button', { name: 'Previous slide' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next slide' }),
    ).toBeInTheDocument();
  });

  it('calls onNext/onPrev when the arrows are clicked', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(
      <GridSlideNav
        activeSlide={1}
        slideCount={3}
        hasMoreBeyondSlides={false}
        showArrows
        platform={Platform.Desktop}
        onPrev={onPrev}
        onNext={onNext}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  it('shows the "view more" nudge instead of a next arrow on the last slide when more data exists', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Next slide' }),
    ).not.toBeInTheDocument();
    // 3, not 2: the visible vertical hint, its plain duplicate below the
    // grid, and an invisible (aria-hidden) clone that exists purely to size
    // the shared grid row to the hint's full un-clamped height.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(3);
  });

  it('shows the nudge but no arrows at all when showArrows is false (mobile)', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        showArrows={false}
        platform={Platform.Mobile}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Next slide' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous slide' }),
    ).not.toBeInTheDocument();
    // 3, not 2: the visible vertical hint, its plain duplicate below the
    // grid, and an invisible (aria-hidden) clone that exists purely to size
    // the shared grid row to the hint's full un-clamped height.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(3);
  });
});
