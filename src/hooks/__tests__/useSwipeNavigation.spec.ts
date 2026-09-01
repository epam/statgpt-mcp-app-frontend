import { renderHook } from '@testing-library/react';
import { useSwipeNavigation, type PointerLike } from '../useSwipeNavigation';

function pointerEvent(clientX: number, clientY: number): PointerLike {
  return { clientX, clientY };
}

describe('useSwipeNavigation', () => {
  it('calls onNext on a leftward swipe past the threshold', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onPrev, onNext));
    result.current.onPointerDown(pointerEvent(300, 100));
    result.current.onPointerMove(pointerEvent(200, 100));
    result.current.onPointerUp(pointerEvent(200, 100));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('calls onPrev on a rightward swipe past the threshold', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onPrev, onNext));
    result.current.onPointerDown(pointerEvent(100, 100));
    result.current.onPointerMove(pointerEvent(200, 100));
    result.current.onPointerUp(pointerEvent(200, 100));
    expect(onPrev).toHaveBeenCalledTimes(1);
    expect(onNext).not.toHaveBeenCalled();
  });

  it('calls neither when the horizontal delta is below the threshold', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onPrev, onNext));
    result.current.onPointerDown(pointerEvent(100, 100));
    result.current.onPointerMove(pointerEvent(110, 100));
    result.current.onPointerUp(pointerEvent(110, 100));
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('calls neither when the movement is predominantly vertical', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onPrev, onNext));
    result.current.onPointerDown(pointerEvent(100, 100));
    result.current.onPointerMove(pointerEvent(150, 300));
    result.current.onPointerUp(pointerEvent(150, 300));
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });

  it('does nothing on pointerup without a preceding pointerdown', () => {
    const onPrev = vi.fn();
    const onNext = vi.fn();
    const { result } = renderHook(() => useSwipeNavigation(onPrev, onNext));
    result.current.onPointerUp(pointerEvent(200, 100));
    expect(onPrev).not.toHaveBeenCalled();
    expect(onNext).not.toHaveBeenCalled();
  });
});
