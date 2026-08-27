import { renderHook } from '@testing-library/react';
import { useActiveTab } from '../useActiveTab';

interface Item {
  id: string;
}

describe('useActiveTab', () => {
  it('defaults to the first item', () => {
    const items: Item[] = [{ id: 'a' }, { id: 'b' }];
    const { result } = renderHook(() => useActiveTab(items));
    expect(result.current[0]).toBe('a');
  });

  it('returns undefined for an empty item list', () => {
    const { result } = renderHook(() => useActiveTab<Item['id']>([]));
    expect(result.current[0]).toBeUndefined();
  });

  it('switches to the selected id when the setter is called', () => {
    const items: Item[] = [{ id: 'a' }, { id: 'b' }];
    const { result, rerender } = renderHook(
      ({ items }) => useActiveTab(items),
      {
        initialProps: { items },
      },
    );

    result.current[1]('b');
    rerender({ items });

    expect(result.current[0]).toBe('b');
  });

  it('defaults to preferredInitialId when given and present in items', () => {
    const items: Item[] = [{ id: 'a' }, { id: 'b' }];
    const { result } = renderHook(() => useActiveTab(items, 'b'));
    expect(result.current[0]).toBe('b');
  });

  it('falls back to the first item when preferredInitialId is not present in items', () => {
    const items: Item[] = [{ id: 'a' }, { id: 'b' }];
    const { result } = renderHook(() => useActiveTab(items, 'c'));
    expect(result.current[0]).toBe('a');
  });

  it('falls back to the first item when the active id is no longer present', () => {
    const initial: Item[] = [{ id: 'a' }, { id: 'b' }];
    const { result, rerender } = renderHook(
      ({ items }) => useActiveTab(items),
      {
        initialProps: { items: initial },
      },
    );

    result.current[1]('b');
    rerender({ items: initial });
    expect(result.current[0]).toBe('b');

    rerender({ items: [initial[0]] });
    expect(result.current[0]).toBe('a');
  });
});
