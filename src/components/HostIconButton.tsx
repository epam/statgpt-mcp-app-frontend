import type { ComponentType, SVGProps } from 'react';
import classNames from 'classnames';
import { ICON_SIZE } from '../icons/iconSize';
import { Platform } from '../host/hostContext';

type Variant = 'plain' | 'bordered';

interface Props {
  icon: ComponentType<{ platform: Platform } & SVGProps<SVGSVGElement>>;
  platform: Platform;
  onClick: () => void;
  ariaLabel: string;
  variant?: Variant;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  plain: 'rounded-md',
  bordered: 'rounded-md border border-neutrals-400',
};

/**
 * Shared chrome for a clickable host-native icon: resolves the icon's
 * per-platform pixel size, applies the common button hover/focus styling,
 * and extends the tap target on mobile via an invisible `::before`
 * pseudo-element so the visible icon stays the same size while still
 * meeting both hosts' mobile minimum hit-area guidance.
 *
 * The mobile hit-slop pseudo-element anchors to the nearest positioned
 * ancestor, so `className` must include a `position` value other than
 * `static` (`relative`, or `absolute` if the button itself needs to float).
 * @param icon - Host-icon component to render, sized per `platform`.
 * @param platform - The desktop/mobile bucket derived from the host context; drives icon size and the mobile hit-slop.
 * @param onClick - Called when the button is clicked.
 * @param ariaLabel - Accessible label for the button.
 * @param variant - `'plain'` (default) for a borderless icon button, or `'bordered'` for a bordered chip — e.g. a pager's prev/next buttons.
 * @param className - Additional classes; must include a non-`static` `position` utility.
 */
export function HostIconButton({
  icon: Icon,
  platform,
  onClick,
  ariaLabel,
  variant = 'plain',
  className,
}: Props) {
  const size = ICON_SIZE[platform];
  const isMobile = platform === Platform.Mobile;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={classNames(
        'z-10 p-1.5 text-neutrals-700 hover:bg-neutrals-200 hover:text-neutrals-1000 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        isMobile && "before:absolute before:inset-[-4px] before:content-['']",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon platform={platform} width={size} height={size} />
    </button>
  );
}
