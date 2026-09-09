import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTInfo from './chatgpt/info.svg?react';
import ClaudeInfoDesktop from './claude/desktop/info.svg?react';
import ClaudeInfoMobile from './claude/mobile/info.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
}

/**
 * Renders the info icon sourced from the current AI host's own icon set:
 * ChatGPT's vendored Info icon, or Claude's vendored desktop/mobile info
 * icon depending on `platform`.
 * @param platform - The desktop/mobile bucket derived from the host context.
 */
export function InfoIcon({ platform, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTInfo,
    claudeDesktop: ClaudeInfoDesktop,
    claudeMobile: ClaudeInfoMobile,
  });
  return <Icon {...props} />;
}
