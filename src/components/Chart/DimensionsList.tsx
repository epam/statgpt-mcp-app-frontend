import type { ChartUnit } from '@epam/statgpt-conversation-view';
import classNames from 'classnames';

type Dimension = ChartUnit['dimensions'][number];

interface RowProps {
  dimension: Dimension;
}

/**
 * One dimension as a horizontal label/value pair, wrapping to a second line
 * only if the pair itself doesn't fit on one line — replacing the shared
 * library's vertical label-then-value stack.
 * @param dimension - The dimension's id, title, and value to display.
 */
function DimensionRow({ dimension }: RowProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-1">
      <span className="caption text-neutrals-700">{dimension.title}:</span>
      <span className="h4 text-neutrals-1000">{dimension.value}</span>
    </div>
  );
}

interface Props {
  dimensions: Dimension[];
  className?: string;
}

/**
 * List of a chart unit's dimension values, one horizontal label/value row
 * per dimension.
 * @param dimensions - Dimensions to display, in the order provided.
 * @param className - Additional classes for the list's root element.
 */
export function DimensionsList({ dimensions, className }: Props) {
  if (dimensions.length === 0) return null;

  return (
    <div className={classNames('flex flex-col gap-1', className)}>
      {dimensions.map((dimension) => (
        <DimensionRow key={dimension.id} dimension={dimension} />
      ))}
    </div>
  );
}
