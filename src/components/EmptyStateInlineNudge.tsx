import classNames from 'classnames';
import { FullscreenIcon } from '../icons/FullscreenIcon';
import { ICON_SIZE } from '../icons/iconSize';
import { InfoIcon } from '../icons/InfoIcon';
import { Platform } from '../host/hostContext';
import { HostIconButton } from './HostIconButton';

interface Props {
  platform: Platform;
  onBrowse: () => void;
}

/**
 * Static, non-scrolling nudge shown in inline mode in place of the tabbed
 * candidate-dataset/missing-dimension grids (`EmptyStateTabs`), which don't
 * fit inline mode's no-scroll/no-tabs constraint. Points the user at
 * fullscreen instead of rendering the grids directly. Purely presentational
 * — the caller decides whether to render this at all (e.g. gated on
 * `canRequestFullscreen`, see `AppContent.tsx`). Only ever rendered in
 * genuine inline mode, so the mobile edge margin (matching `ErrorBanner`'s
 * bordered-box convention, not `EmptyStateTabs`' edge-to-edge padding) is
 * unconditional on `platform` alone, with no separate `isInline` prop.
 * @param platform - The desktop/mobile bucket derived from the host context; sizes the icon, adds the mobile hit-slop to the button, and adds mobile edge margin to the card itself.
 * @param onBrowse - Called when the "Browse" button is clicked, to request the host switch to fullscreen.
 */
export function EmptyStateInlineNudge({ platform, onBrowse }: Props) {
  const iconSize = ICON_SIZE[platform];
  const isMobile = platform === Platform.Mobile;
  return (
    <div
      className={classNames(
        'flex flex-wrap items-center gap-1 rounded-sm bg-neutrals-100 px-2 py-1',
        { 'mx-4': isMobile },
      )}
    >
      <InfoIcon
        platform={platform}
        width={iconSize}
        height={iconSize}
        className="shrink-0 self-start text-neutrals-1000"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutrals-1000">
          Not sure which one fits?
        </p>
        <p className="text-sm text-neutrals-700">
          Browse available dimensions to find the exact one.
        </p>
      </div>
      <HostIconButton
        icon={FullscreenIcon}
        platform={platform}
        onClick={onBrowse}
        ariaLabel="Browse"
        label="Browse"
        variant="bordered"
        className="relative shrink-0"
      />
    </div>
  );
}
