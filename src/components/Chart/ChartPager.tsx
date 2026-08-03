import classNames from 'classnames';
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons/ChevronIcon';
import type { Platform } from '../../host/hostContext';
import { HostIconButton } from '../HostIconButton';

interface Props {
  currentIndex: number;
  totalCount: number;
  onPrev: () => void;
  onNext: () => void;
  platform: Platform;
  showLabel?: boolean;
  className?: string;
}

function noop() {}

/**
 * Prev/next pager for stepping through a chart's units, shown only when
 * there's more than one to page through. Prev/next buttons are always
 * bordered chips built on `HostIconButton` with a host-native chevron,
 * matching every other icon-button in this widget, and are dimmed and inert
 * at the first/last chart.
 *
 * This pager appears twice: once below the chart with its "current/total"
 * label shown, and again as a compact duplicate next to the chart title
 * with the label hidden (`showLabel={false}`) — both instances share the
 * same bordered button styling.
 * @param currentIndex - Zero-based index of the chart unit currently shown.
 * @param totalCount - Total number of chart units available.
 * @param onPrev - Called to show the previous chart unit.
 * @param onNext - Called to show the next chart unit.
 * @param platform - The desktop/mobile bucket derived from the host context; drives icon size and mobile hit-slop.
 * @param showLabel - Whether to show the "current/total" label between the buttons. Defaults to `true`.
 * @param className - Additional classes for the pager's root element.
 */
export function ChartPager({
  currentIndex,
  totalCount,
  onPrev,
  onNext,
  platform,
  showLabel = true,
  className,
}: Props) {
  if (totalCount <= 1) return null;

  const isPrevDisabled = currentIndex === 0;
  const isNextDisabled = currentIndex + 1 === totalCount;

  return (
    <div
      className={classNames(
        'flex items-center gap-2',
        showLabel && 'self-center',
        className,
      )}
    >
      <HostIconButton
        icon={ChevronLeftIcon}
        platform={platform}
        onClick={isPrevDisabled ? noop : onPrev}
        ariaLabel="Previous chart"
        variant="bordered"
        className={classNames(
          'relative',
          isPrevDisabled && 'pointer-events-none opacity-40',
        )}
      />
      {showLabel && (
        <span className="h4 select-none text-neutrals-800">
          {currentIndex + 1}/{totalCount}
        </span>
      )}
      <HostIconButton
        icon={ChevronRightIcon}
        platform={platform}
        onClick={isNextDisabled ? noop : onNext}
        ariaLabel="Next chart"
        variant="bordered"
        className={classNames(
          'relative',
          isNextDisabled && 'pointer-events-none opacity-40',
        )}
      />
    </div>
  );
}
