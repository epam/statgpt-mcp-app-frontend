import { FullscreenIcon } from '../icons/FullscreenIcon';
import { Platform } from '../host/hostContext';
import { HostIconButton } from './HostIconButton';

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
 * Visible padding (`p-1.5`, from `HostIconButton`) stays identical on both
 * platforms so the button stays visually proportionate to the compact tab
 * bar it sits beside. On mobile, an invisible `::before` pseudo-element
 * extends the clickable area by 4px on every side instead, turning the 36px
 * visible button (24px icon + 12px padding) into a 44x44 tap target that
 * meets both hosts' mobile minimum without changing what's shown.
 * @param onRequestFullscreen - Called when the button is clicked, to request the host switch display mode.
 * @param platform - The desktop/mobile bucket derived from the host context; drives icon size and the mobile hit-slop.
 */
export function FullscreenButton({ onRequestFullscreen, platform }: Props) {
  return (
    <HostIconButton
      icon={FullscreenIcon}
      platform={platform}
      onClick={onRequestFullscreen}
      ariaLabel="Expand to fullscreen"
      className="absolute right-0 top-0"
    />
  );
}
