import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Owns "which tab is active" state for a list of tab-like items, defaulting
 * to the first item and falling back to it whenever the previously-active
 * id is no longer present in `items` (e.g. an attachment disappeared).
 *
 * Shared by every `Tabs` consumer so this fallback logic exists in exactly
 * one place — `Tabs` itself is a fully controlled component with no state
 * of its own.
 *
 * @param items - The current tab items; only `id` is read.
 */
export function useActiveTab<Id extends string = string>(
  items: { id: Id }[],
): [Id | undefined, Dispatch<SetStateAction<Id | undefined>>] {
  const [activeId, setActiveId] = useState<Id | undefined>(items[0]?.id);
  const effectiveId = items.some((item) => item.id === activeId)
    ? activeId
    : items[0]?.id;
  return [effectiveId, setActiveId];
}
