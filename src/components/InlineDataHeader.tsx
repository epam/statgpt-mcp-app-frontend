import { FullscreenIcon } from '../icons/FullscreenIcon';
import type { Platform } from '../host/hostContext';
import { HostIconButton } from './HostIconButton';

interface Props {
  text: string;
  platform: Platform;
  onExploreData: () => void;
}

const EXPLORE_DATA_LABEL = 'Explore the data';

/**
 * Header row shown above inline mode's chart-only content — caption text on
 * the left, a single button on the right that asks the host to switch to
 * fullscreen, where the full data table and code are available. Distinct
 * from `FullscreenButton`, which still serves the empty-state-tabs fallback
 * and pip mode.
 * @param text - Caption text; varies depending on whether a chart is available.
 * @param platform - The desktop/mobile bucket derived from the host context; sizes the button's expand icon and its mobile hit-slop.
 * @param onExploreData - Called when the button is clicked, to request the host switch display mode.
 */
export function InlineDataHeader({ text, platform, onExploreData }: Props) {
  return (
    <div className="flex items-center justify-between gap-2 pb-3">
      <span className="text-xs text-neutrals-700">{text}</span>
      <HostIconButton
        icon={FullscreenIcon}
        platform={platform}
        onClick={onExploreData}
        ariaLabel={EXPLORE_DATA_LABEL}
        label={EXPLORE_DATA_LABEL}
        variant="bordered"
        className="relative shrink-0"
      />
    </div>
  );
}
