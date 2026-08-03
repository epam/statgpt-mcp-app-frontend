import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTExternalLink from './chatgpt/external-link.svg?react';
import ClaudeExternalLinkDesktop from './claude/desktop/external-link.svg?react';
import ClaudeExternalLinkMobile from './claude/mobile/external-link.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
}

/**
 * Renders the external-link icon sourced from the current AI host's own
 * icon set: ChatGPT's vendored external-link icon, or Claude's vendored
 * desktop/mobile external-link icon depending on `platform`.
 * @param platform - The desktop/mobile bucket derived from the host context.
 */
export function ExternalLinkIcon({ platform, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTExternalLink,
    claudeDesktop: ClaudeExternalLinkDesktop,
    claudeMobile: ClaudeExternalLinkMobile,
  });
  return <Icon {...props} />;
}
