import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';

export const HostKind = { Claude: 'claude', ChatGpt: 'chatgpt' } as const;
export type HostKind = (typeof HostKind)[keyof typeof HostKind];

export const Platform = { Desktop: 'desktop', Mobile: 'mobile' } as const;
export type Platform = (typeof Platform)[keyof typeof Platform];

export const DisplayMode = {
  Inline: 'inline',
  Fullscreen: 'fullscreen',
  Pip: 'pip',
} as const;
export type DisplayMode = (typeof DisplayMode)[keyof typeof DisplayMode];

/**
 * Detects which AI host is running the widget. ChatGPT injects a global
 * `window.openai` object; Claude does not, so its absence is treated as the
 * default.
 */
export function detectHostKind(): HostKind {
  return typeof window !== 'undefined' && 'openai' in window
    ? HostKind.ChatGpt
    : HostKind.Claude;
}

/**
 * Derives a desktop/mobile platform bucket from the host's spec
 * `hostContext.platform` field. The spec also allows `'web'`, but we only
 * need the desktop/mobile distinction here, so `'web'` (and an absent
 * value) are treated as `Platform.Desktop`.
 * @param hostContext - The current spec host context, once available post-handshake.
 */
export function usePlatform(
  hostContext: McpUiHostContext | undefined,
): Platform {
  return hostContext?.platform === 'mobile'
    ? Platform.Mobile
    : Platform.Desktop;
}

/**
 * Derives the current display mode from `hostContext.displayMode`, which is
 * only present once the host handshake has completed. Defaults to
 * `DisplayMode.Inline` beforehand, mirroring `usePlatform`'s default.
 * @param hostContext - The current spec host context, once available post-handshake.
 */
export function useDisplayMode(
  hostContext: McpUiHostContext | undefined,
): DisplayMode {
  return hostContext?.displayMode ?? DisplayMode.Inline;
}
