import classNames from 'classnames';
import { Platform } from '../../host/hostContext';
import type { LegendItem } from './chartOptionTransforms';

interface Props {
  items: LegendItem[];
  selected: Record<string, boolean>;
  onToggle: (name: string) => void;
  platform: Platform;
  className?: string;
}

interface MarkerProps {
  color: string;
}

/**
 * Mirrors ECharts' own default legend marker for a `line` series: a short
 * line segment, a hollow (stroke-only) circle, another line segment — all
 * in the series' color.
 * @param color - The series' resolved color.
 */
function LegendMarker({ color }: MarkerProps) {
  return (
    <svg
      width="24"
      height="14"
      viewBox="0 0 24 14"
      className="shrink-0"
      aria-hidden
    >
      <line x1="0" y1="7" x2="6" y2="7" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="7" r="6" stroke={color} strokeWidth="2" fill="none" />
      <line x1="18" y1="7" x2="24" y2="7" stroke={color} strokeWidth="2" />
    </svg>
  );
}

/**
 * DOM-rendered replacement for ECharts' built-in legend: one marker/name
 * pair per series, laid out with `flex-wrap` so it grows to as many rows as
 * the series list needs instead of scrolling or competing with the plot
 * area for space. Clicking an item toggles that series' visibility on the
 * chart via `onToggle`; deselected items are dimmed to reflect that.
 * @param items - Series name/color pairs, in render order.
 * @param selected - Per-series selection state; a name missing from this map counts as selected.
 * @param onToggle - Called with a series' name when its legend item is clicked.
 * @param platform - The desktop/mobile bucket derived from the host context; on mobile, each
 * item gets extra vertical padding so its tap target reaches the 44pt minimum.
 * @param className - Additional classes for the legend's root element.
 */
export function ChartLegend({
  items,
  selected,
  onToggle,
  platform,
  className,
}: Props) {
  if (items.length === 0) return null;

  const isMobile = platform === Platform.Mobile;

  return (
    <div className={classNames('flex flex-wrap gap-x-3 gap-y-1', className)}>
      {items.map((item) => {
        const isSelected = selected[item.name] ?? true;
        return (
          <button
            key={item.name}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(item.name)}
            className={classNames(
              'caption flex items-center gap-1.5 text-neutrals-800',
              isMobile && 'py-[14px]',
              !isSelected && 'opacity-40',
            )}
          >
            <LegendMarker color={item.color} />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
