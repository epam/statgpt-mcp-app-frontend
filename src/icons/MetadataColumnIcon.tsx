import type { SVGProps } from 'react';
import type { Platform } from '../host/hostContext';
import { detectHostKind } from '../host/hostContext';
import ChatGPTMetadata from './chatgpt/metadata.svg?react';
import ClaudeMetadataDesktop from './claude/desktop/metadata.svg?react';
import ClaudeMetadataMobile from './claude/mobile/metadata.svg?react';
import { selectHostIcon } from './selectHostIcon';

interface Props extends SVGProps<SVGSVGElement> {
  platform: Platform;
}

/**
 * Renders the pinned metadata column's info icon sourced from the current AI
 * host's own icon set: ChatGPT's vendored info icon, or Claude's vendored
 * desktop/mobile info icon depending on `platform`.
 * @param platform - The desktop/mobile bucket derived from the host context.
 */
export function MetadataColumnIcon({ platform, ...props }: Props) {
  const Icon = selectHostIcon(detectHostKind(), platform, {
    chatgpt: ChatGPTMetadata,
    claudeDesktop: ClaudeMetadataDesktop,
    claudeMobile: ClaudeMetadataMobile,
  });
  return <Icon {...props} />;
}
