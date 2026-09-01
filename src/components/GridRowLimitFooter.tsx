import { FullscreenIcon } from '../icons/FullscreenIcon';
import type { Platform } from '../host/hostContext';
import { HostIconButton } from './HostIconButton';

interface Props {
  total: number;
  visible: number;
  platform: Platform;
  onOpenFullView: () => void;
}

/**
 * Footer shown below the inline grid whenever its visible-row cap is hiding
 * some of the dataset — lets the user reach the rest via fullscreen instead
 * of scrolling, which inline mode doesn't support on either platform.
 * Restored from the pre-`0016` implementation (recovered from git history,
 * `de4bc2c`); unlike the original, this is shown on both desktop and mobile
 * — desktop no longer falls back to AG Grid's own internal scroll for rows
 * beyond the cap, so the escape hatch is needed there too. The caller
 * decides when to render this at all.
 * @param total - The dataset's real row count.
 * @param visible - The number of rows currently visible (the cap).
 * @param platform - The desktop/mobile bucket derived from the host context; sizes the button's expand icon and its mobile hit-slop.
 * @param onOpenFullView - Called when the button is clicked, to request the host switch display mode.
 */
export function GridRowLimitFooter({
  total,
  visible,
  platform,
  onOpenFullView,
}: Props) {
  return (
    <div className="flex items-center justify-between gap-2 pt-3">
      <span className="text-xs text-neutrals-700">
        Showing {visible} of {total} results
      </span>
      <HostIconButton
        icon={FullscreenIcon}
        platform={platform}
        onClick={onOpenFullView}
        ariaLabel="Open full view"
        label="Open full view"
        variant="bordered"
        className="relative"
      />
    </div>
  );
}
