import type { ComponentType, SVGProps } from 'react';
import classNames from 'classnames';
import { ICON_SIZE } from '../icons/iconSize';
import { Platform } from '../host/hostContext';

type Variant = 'plain' | 'bordered' | 'floating';

interface Props {
  icon: ComponentType<{ platform: Platform } & SVGProps<SVGSVGElement>>;
  platform: Platform;
  onClick: () => void;
  ariaLabel: string;
  variant?: Variant;
  className?: string;
  label?: string;
  disabled?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  plain: 'rounded-md',
  bordered: 'rounded-md border border-neutrals-400',
  floating:
    'rounded-full bg-[var(--color-background-primary,#fff)] shadow-drop',
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
 * @param variant - `'plain'` (default) for a borderless icon button, `'bordered'` for a bordered chip — e.g. a pager's prev/next buttons — or `'floating'` for a circular button meant to sit absolutely positioned over content.
 * @param className - Additional classes; must include a non-`static` `position` utility.
 * @param label - Optional visible text rendered after the icon, for a labeled button instead of an icon-only one. The mobile hit-slop still applies, keyed off the icon's footprint.
 * @param disabled - When true, disables the button natively and applies a dimmed, non-interactive style. Defaults to false.
 */
export function HostIconButton({
  icon: Icon,
  platform,
  onClick,
  ariaLabel,
  variant = 'plain',
  className,
  label,
  disabled = false,
}: Props) {
  const size = ICON_SIZE[platform];
  const isMobile = platform === Platform.Mobile;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={classNames(
        'z-10 flex items-center hover:bg-neutrals-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        label
          ? 'gap-1.5 py-1.5 pl-1.5 pr-2 text-xs font-medium text-neutrals-1000'
          : 'p-1.5 text-neutrals-700 hover:text-neutrals-1000',
        disabled && 'pointer-events-none opacity-40',
        isMobile && "before:absolute before:inset-[-4px] before:content-['']",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <Icon platform={platform} width={size} height={size} />
      {label}
    </button>
  );
}
