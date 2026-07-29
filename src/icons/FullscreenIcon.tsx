import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTExpand from './chatgpt/expand.svg?react';
import ClaudeMaximizeDesktop from './claude/desktop/maximize.svg?react';
import ClaudeMaximizeMobile from './claude/mobile/maximize.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
}

/**
 * Renders the fullscreen/expand icon sourced from the current AI host's own
 * icon set: ChatGPT's vendored `Expand` icon, or Claude's vendored desktop/mobile
 * maximize icon depending on `platform`.
 * @param platform - The desktop/mobile bucket derived from the host context.
 */
export function FullscreenIcon({ platform, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTExpand,
    claudeDesktop: ClaudeMaximizeDesktop,
    claudeMobile: ClaudeMaximizeMobile,
  });
  return <Icon {...props} />;
}
