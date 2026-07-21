import { IconArrowsMaximize } from '@tabler/icons-react';

interface Props {
  onRequestFullscreen: () => void;
}

/**
 * Floating button that asks the host to switch the widget's display mode to
 * fullscreen. Neither Claude nor ChatGPT draws this affordance on the
 * widget's behalf, so the widget must provide its own; the host's native
 * close button takes over once fullscreen is active.
 */
export function FullscreenButton({ onRequestFullscreen }: Props) {
  return (
    <button
      type="button"
      onClick={onRequestFullscreen}
      aria-label="Expand to fullscreen"
      className="absolute right-0 top-0 z-10 rounded-md p-1.5 text-neutrals-700 hover:bg-neutrals-200 hover:text-neutrals-1000 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
    >
      <IconArrowsMaximize width={18} height={18} />
    </button>
  );
}
