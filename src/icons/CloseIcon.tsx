import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTClose from './chatgpt/close.svg?react';
import ClaudeCloseDesktop from './claude/desktop/close.svg?react';
import ClaudeCloseMobile from './claude/mobile/close.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
}

/**
 * Renders the close icon sourced from the current AI host's own icon set:
 * ChatGPT's vendored close icon, or Claude's vendored desktop/mobile close
 * icon depending on `platform`.
 * @param platform - The desktop/mobile bucket derived from the host context.
 */
export function CloseIcon({ platform, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTClose,
    claudeDesktop: ClaudeCloseDesktop,
    claudeMobile: ClaudeCloseMobile,
  });
  return <Icon {...props} />;
}
