import { bridge } from '../bridge';
import type { Platform } from '../host/hostContext';
import { ExternalLinkIcon } from '../icons/ExternalLinkIcon';
import { HostIconButton } from './HostIconButton';

interface Props {
  url: string;
  platform: Platform;
}

/**
 * External-link control for the metadata popup's dataset title, replacing
 * the shared component's default `<a target="_blank">` with a host-mediated
 * `ui/open-link` call — sidesteps both the iframe-sandbox popup question and
 * the mobile-WebView new-window-delegate question, giving one consistent
 * behavior across hosts instead of a per-host gamble.
 *
 * @param url - Dataset source URL to open.
 * @param platform - The desktop/mobile bucket derived from the host context; drives icon size and mobile hit-slop.
 */
export function ExternalLinkButton({ url, platform }: Props) {
  return (
    <HostIconButton
      icon={ExternalLinkIcon}
      platform={platform}
      onClick={() => {
        void bridge.openLink(url);
      }}
      ariaLabel="Open dataset source"
      className="relative"
    />
  );
}
