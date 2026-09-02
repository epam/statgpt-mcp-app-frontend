import { render, screen } from '@testing-library/react';
import { GridSlideNav } from '../GridSlideNav';

describe('GridSlideNav', () => {
  it('renders nothing when there is only one slide and nothing beyond it', () => {
    const { container } = render(
      <GridSlideNav
        activeSlide={0}
        slideCount={1}
        hasMoreBeyondSlides={false}
        hasMoreRows={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on a middle slide, even when both kinds of truncation exist', () => {
    const { container } = render(
      <GridSlideNav
        activeSlide={1}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the vertical "view more" hint on the last slide when more columns exist, without the rows line', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows={false}
      />,
    );
    // 2: the visible vertical hint and its invisible (aria-hidden) sizing
    // clone — no plain duplicate line below, since that's gated by
    // `hasMoreRows` (false here), independent of `hasMoreBeyondSlides`.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(2);
  });

  it('shows only the plain duplicate line (no vertical hint) when only rows are truncated', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides={false}
        hasMoreRows
      />,
    );
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(1);
  });

  it('shows both hints together when both columns and rows are truncated', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows
      />,
    );
    // 3: vertical hint + its invisible sizing clone + the plain duplicate line.
    expect(screen.getAllByText('To view more, open full view')).toHaveLength(3);
  });

  it('keeps the visible vertical hint at least 4px off the right edge', () => {
    render(
      <GridSlideNav
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides
        hasMoreRows={false}
      />,
    );
    // Index 1: the invisible aria-hidden sizing clone renders first in the
    // JSX, the real visible hint second.
    const [, visibleHint] = screen.getAllByText('To view more, open full view');
    expect(visibleHint).toHaveClass('right-1');
    expect(visibleHint).not.toHaveClass('right-0');
  });
});
