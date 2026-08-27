import { useState, type Dispatch, type SetStateAction } from 'react';

/**
 * Owns "which tab is active" state for a list of tab-like items, defaulting
 * to `preferredInitialId` (or the first item, if that's not given or not
 * present in `items`) and falling back to the first item whenever the
 * active id is no longer present in `items` (e.g. an attachment
 * disappeared).
 *
 * Shared by every `Tabs` consumer so this fallback logic exists in exactly
 * one place — `Tabs` itself is a fully controlled component with no state
 * of its own.
 *
 * @param items - The current tab items; only `id` is read.
 * @param preferredInitialId - Tab id to select initially instead of the first item, if present in `items`; e.g. `DataView` prefers the Chart tab over Grid when a chart is available.
 */
export function useActiveTab<Id extends string = string>(
  items: { id: Id }[],
  preferredInitialId?: Id,
): [Id | undefined, Dispatch<SetStateAction<Id | undefined>>] {
  const [activeId, setActiveId] = useState<Id | undefined>(
    preferredInitialId ?? items[0]?.id,
  );
  const effectiveId = items.some((item) => item.id === activeId)
    ? activeId
    : items[0]?.id;
  return [effectiveId, setActiveId];
}
