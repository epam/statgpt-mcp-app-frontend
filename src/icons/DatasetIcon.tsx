import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTDataset from './chatgpt/dataset.svg?react';
import ClaudeDataset from './claude/desktop/dataset.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
}

/**
 * Renders the dataset row icon sourced from the current AI host's own icon
 * set: ChatGPT's vendored dataset icon, or Claude's vendored dataset icon
 * (Claude only ships one variant, reused for both desktop and mobile).
 * @param platform - The desktop/mobile bucket derived from the host context.
 */
export function DatasetIcon({ platform, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTDataset,
    claudeDesktop: ClaudeDataset,
    claudeMobile: ClaudeDataset,
  });
  return <Icon {...props} />;
}
