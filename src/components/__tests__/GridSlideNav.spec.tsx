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
        hasMoreRows={false}
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
        hasMoreRows={false}
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
        hasMoreRows={false}
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
        hasMoreRows={false}
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

  it('shows the vertical "view more" hint instead of a next arrow on the last slide when more columns exist, without the rows line', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows={false}
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'Next slide' }),
    ).not.toBeInTheDocument();
    // 2, not 3: the visible vertical hint and its invisible (aria-hidden)
    // sizing clone — no plain duplicate line below, since that's gated by
    // `hasMoreRows` (false here), independent of `hasMoreBeyondSlides`.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(2);
  });

  it('shows only the plain duplicate line (no vertical hint, no next-arrow replacement) when only rows are truncated', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides={false}
        hasMoreRows
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    // No columns overflow, so no vertical hint and the next arrow position
    // is free — but slideCount=3 with activeSlide=2 means there IS no next
    // arrow anyway (already the last slide); the point here is the vertical
    // hint specifically doesn't appear.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(1);
  });

  it('shows both hints together when both columns and rows are truncated', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows
        showArrows
        platform={Platform.Desktop}
        onPrev={() => {}}
        onNext={() => {}}
      />,
    );
    // 3: vertical hint + its invisible sizing clone + the plain duplicate
    // line — both independent conditions are true here.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(3);
  });

  it('shows the vertical hint but no arrows at all when showArrows is false (mobile)', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows
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
