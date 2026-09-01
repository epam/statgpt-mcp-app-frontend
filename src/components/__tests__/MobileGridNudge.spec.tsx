import { render, screen } from '@testing-library/react';
import { MobileGridNudge } from '../MobileGridNudge';

describe('MobileGridNudge', () => {
  it('renders nothing on a middle slide, even when columns overflow', () => {
    const { container } = render(
      <MobileGridNudge activeSlide={0} slideCount={3} hasMoreBeyondSlides />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing on the last slide when columns do not overflow', () => {
    const { container } = render(
      <MobileGridNudge
        activeSlide={2}
        slideCount={3}
        hasMoreBeyondSlides={false}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the hint on the last slide when columns overflow', () => {
    render(
      <MobileGridNudge activeSlide={2} slideCount={3} hasMoreBeyondSlides />,
    );
    expect(
      screen.getByText('To view more, open full view'),
    ).toBeInTheDocument();
  });

  it('treats a single slide with column overflow as the last slide', () => {
    render(
      <MobileGridNudge activeSlide={0} slideCount={1} hasMoreBeyondSlides />,
    );
    expect(
      screen.getByText('To view more, open full view'),
    ).toBeInTheDocument();
  });
});
