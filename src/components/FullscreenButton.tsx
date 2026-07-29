import classNames from 'classnames';
import { FullscreenIcon } from '../icons/FullscreenIcon';
import { ICON_SIZE } from '../icons/iconSize';
import { Platform } from '../host/hostContext';

interface Props {
  onRequestFullscreen: () => void;
  platform: Platform;
}

/**
 * Floating button that asks the host to switch the widget's display mode to
 * fullscreen. Neither Claude nor ChatGPT draws this affordance on the
 * widget's behalf, so the widget must provide its own; the host's native
 * close button takes over once fullscreen is active.
 *
 * Visible padding (`p-1.5`) stays identical on both platforms so the button
 * stays visually proportionate to the compact tab bar it sits beside. On
 * mobile, an invisible `::before` pseudo-element extends the clickable area
 * by 4px on every side instead, turning the 36px visible button (24px icon +
 * 12px padding) into a 44x44 tap target that meets both hosts' mobile
 * minimum without changing what's shown.
 * @param onRequestFullscreen - Called when the button is clicked, to request the host switch display mode.
 * @param platform - The desktop/mobile bucket derived from the host context; drives icon size and the mobile hit-slop.
 */
export function FullscreenButton({ onRequestFullscreen, platform }: Props) {
  const size = ICON_SIZE[platform];
  const isMobile = platform === Platform.Mobile;
  return (
    <button
      type="button"
      onClick={onRequestFullscreen}
      aria-label="Expand to fullscreen"
      className={classNames(
        'absolute right-0 top-0 z-10 rounded-md p-1.5 text-neutrals-700 hover:bg-neutrals-200 hover:text-neutrals-1000 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        isMobile && "before:absolute before:inset-[-4px] before:content-['']",
      )}
    >
      <FullscreenIcon platform={platform} width={size} height={size} />
    </button>
  );
}
