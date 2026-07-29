import { HostKind, Platform } from '../host/hostContext';

export interface HostIconVariants<T> {
  chatgpt: T;
  claudeDesktop: T;
  claudeMobile: T;
}

/**
 * Picks the icon variant matching the given host and platform. ChatGPT has
 * a single icon set regardless of platform; Claude has separate desktop and
 * mobile icon sets.
 * @param hostKind - Which AI host is running the widget.
 * @param platform - The desktop/mobile bucket derived from the host context.
 * @param variants - The three available icon variants to choose from.
 */
export function selectHostIcon<T>(
  hostKind: HostKind,
  platform: Platform,
  variants: HostIconVariants<T>,
): T {
  if (hostKind === HostKind.ChatGpt) return variants.chatgpt;
  return platform === Platform.Mobile
    ? variants.claudeMobile
    : variants.claudeDesktop;
}
