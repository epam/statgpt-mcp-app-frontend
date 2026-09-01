import { renderHook } from '@testing-library/react';
import { useSwipeNavigation, type PointerLike } from '../useSwipeNavigation';

function pointerEvent(
  clientX: number,
  clientY: number,
): PointerLike & { preventDefault: () => void; stopPropagation: () => void } {
  return {
    clientX,
    clientY,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
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

  it('suppresses the move/up events once a drag looks horizontal-dominant, even below the swipe threshold', () => {
    const { result } = renderHook(() => useSwipeNavigation(vi.fn(), vi.fn()));
    result.current.onPointerDown(pointerEvent(100, 100));
    const move = pointerEvent(110, 100);
    result.current.onPointerMove(move);
    expect(move.preventDefault).toHaveBeenCalledTimes(1);
    expect(move.stopPropagation).toHaveBeenCalledTimes(1);

    const up = pointerEvent(110, 100);
    result.current.onPointerUp(up);
    expect(up.preventDefault).toHaveBeenCalledTimes(1);
    expect(up.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it('never suppresses vertical-dominant movement', () => {
    const { result } = renderHook(() => useSwipeNavigation(vi.fn(), vi.fn()));
    result.current.onPointerDown(pointerEvent(100, 100));
    const move = pointerEvent(110, 300);
    result.current.onPointerMove(move);
    expect(move.preventDefault).not.toHaveBeenCalled();
    expect(move.stopPropagation).not.toHaveBeenCalled();

    const up = pointerEvent(110, 300);
    result.current.onPointerUp(up);
    expect(up.preventDefault).not.toHaveBeenCalled();
    expect(up.stopPropagation).not.toHaveBeenCalled();
  });
});
