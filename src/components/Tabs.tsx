import { useState, type ReactNode } from 'react';
import classNames from 'classnames';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface Props {
  items: TabItem[];
  /** Expands to fill its container's height (fullscreen/pip), matching `DataView`'s `fillHeight`. */
  fillHeight?: boolean;
}

/**
 * Generic tab strip + panel, styled to match `DataView.tsx`'s existing
 * Grid/Chart/Code tab bar so tabs look consistent wherever they appear in
 * the widget.
 *
 * `DataView.tsx` intentionally does NOT use this component for its own
 * tabs — its tab switching carries side effects specific to its fixed
 * Grid/Chart/Code set (closing the metadata side panel on tab change,
 * writing `document.documentElement.dataset.activeTab` for e2e hooks,
 * computing `availableTabs` from which attachment props are present).
 * Generalizing that logic to also serve a dynamic tab list was judged
 * higher-risk than beneficial for the empty-state feature this component
 * was built for — it would touch working, shipped code for no behavioral
 * gain. Revisit unifying the two if a third tabbed-UI consumer appears.
 *
 * @param items - Tabs to render, in order. The first item's content is
 * shown by default.
 * @param fillHeight - When true, the tab panel and active content stretch
 * to fill the container's height instead of sizing to their content.
 */
export function Tabs({ items, fillHeight }: Props) {
  const [activeId, setActiveId] = useState<string | undefined>(items[0]?.id);
  const effectiveId = items.some((item) => item.id === activeId)
    ? activeId
    : items[0]?.id;
  const activeItem = items.find((item) => item.id === effectiveId);

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
            onClick={() => setActiveId(item.id)}
            className={classNames(
              'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-primary',
              effectiveId === item.id
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
