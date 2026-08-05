import type { ReactNode } from 'react';
import classNames from 'classnames';

export interface TabItem<Id extends string = string> {
  id: Id;
  label: string;
  content: ReactNode;
}

interface Props<Id extends string> {
  items: TabItem<Id>[];
  activeId: Id | undefined;
  onSelect: (id: Id) => void;
  fillHeight?: boolean;
}

/**
 * Generic, fully controlled tab strip + panel, styled to match `DataView`'s
 * Grid/Chart/Code tab bar so tabs look consistent wherever they appear in
 * the widget. Renders whichever item's `id` matches `activeId` — it holds
 * no state of its own; pair it with `useActiveTab` for the usual
 * "default to first item, fall back to first when the active id
 * disappears" behavior.
 *
 * @param items - Tabs to render, in order.
 * @param activeId - The currently active item's id; nothing renders below
 * the tab bar if no item matches.
 * @param onSelect - Called with an item's id when its button is clicked.
 * @param fillHeight - When true, the tab panel and active content stretch
 * to fill the container's height instead of sizing to their content.
 */
export function Tabs<Id extends string>({
  items,
  activeId,
  onSelect,
  fillHeight,
}: Props<Id>) {
  const activeItem = items.find((item) => item.id === activeId);

  return (
    <div
      className={classNames('flex flex-col gap-3', {
        'h-full min-h-0': fillHeight,
      })}
    >
      <div className="flex border-b border-neutrals-400">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={classNames(
              'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary',
              activeId === item.id
                ? 'border-semantic-info text-semantic-info'
                : 'border-transparent text-neutrals-700 hover:text-neutrals-1000',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={classNames({ 'flex-1 min-h-0': fillHeight })}>
        {activeItem?.content}
      </div>
    </div>
  );
}
