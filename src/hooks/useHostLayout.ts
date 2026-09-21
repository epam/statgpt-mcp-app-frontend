import { useCallback, useEffect } from 'react';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { bridge } from '../bridge';
import {
  detectHostKind,
  useDisplayMode,
  usePlatform,
} from '../host/hostContext';
import {
  INLINE_ABSENT_SAFE_AREA_FALLBACK,
  resolveEffectiveSafeArea,
  resolveMinSafeArea,
  shouldUseInlineAbsentFallback,
} from '../host/safeArea';

export interface HostLayout {
  isFillHeight: boolean;
  isFullscreen: boolean;
  canRequestFullscreen: boolean;
  requestFullscreen: () => void;
  locale: string | undefined;
  /**
   * Whether `--mcp-safe-area-*` is currently set from
   * `INLINE_ABSENT_SAFE_AREA_FALLBACK` — a true fallback applied outright,
   * not merged against a reported value — rather than from a host-reported
   * `safeAreaInsets`. Only ever `true` once the host handshake has actually
   * completed and the host still reported nothing for inline; never `true`
   * merely because `hostContext` hasn't arrived yet. Consumers that add
   * their own inline-mode spacing (e.g. `AppContent`'s loading-placeholder
   * margin) should suppress it when this is true, so the two don't stack.
   */
  hasInlineSafeAreaFallback: boolean;
}

/**
 * Syncs host context layout values onto CSS custom properties and returns derived layout flags for the React tree.
 */
export function useHostLayout(
  hostContext: McpUiHostContext | undefined,
): HostLayout {
  const displayMode = hostContext?.displayMode;

  useEffect(() => {
    if (displayMode) {
      document.documentElement.dataset.displayMode = displayMode;
    } else {
      delete document.documentElement.dataset.displayMode;
    }
    return () => {
      delete document.documentElement.dataset.displayMode;
    };
  }, [displayMode]);

  const containerDimensions = hostContext?.containerDimensions;
  useEffect(() => {
    const dims = containerDimensions as Record<string, number> | undefined;
    const h = dims?.height ?? dims?.maxHeight;
    const w = dims?.width;
    if (h != null) {
      document.documentElement.style.setProperty(
        '--mcp-container-height',
        `${h}px`,
      );
    } else {
      document.documentElement.style.removeProperty('--mcp-container-height');
    }
    if (w != null) {
      document.documentElement.style.setProperty(
        '--mcp-container-width',
        `${w}px`,
      );
    } else {
      document.documentElement.style.removeProperty('--mcp-container-width');
    }
  }, [containerDimensions]);

  const safeAreaInsets = hostContext?.safeAreaInsets;
  const platform = usePlatform(hostContext);
  const currentDisplayMode = useDisplayMode(hostContext);

  useEffect(() => {
    document.documentElement.dataset.platform = platform;
    return () => {
      delete document.documentElement.dataset.platform;
    };
  }, [platform]);

  const hasInlineSafeAreaFallback =
    hostContext !== undefined &&
    shouldUseInlineAbsentFallback(
      detectHostKind(),
      currentDisplayMode,
      safeAreaInsets,
    );

  useEffect(() => {
    if (hasInlineSafeAreaFallback) {
      const fallback = INLINE_ABSENT_SAFE_AREA_FALLBACK[platform];
      (['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
        document.documentElement.style.setProperty(
          `--mcp-safe-area-host-${side}`,
          '0px',
        );
        document.documentElement.style.setProperty(
          `--mcp-safe-area-min-${side}`,
          `${fallback[side]}px`,
        );
        document.documentElement.style.setProperty(
          `--mcp-safe-area-${side}`,
          `${fallback[side]}px`,
        );
      });
      return;
    }

    const host = {
      top: safeAreaInsets?.top ?? 0,
      right: safeAreaInsets?.right ?? 0,
      bottom: safeAreaInsets?.bottom ?? 0,
      left: safeAreaInsets?.left ?? 0,
    };
    const min = resolveMinSafeArea(
      detectHostKind(),
      platform,
      currentDisplayMode,
    );
    const effective = resolveEffectiveSafeArea(host, min);

    (['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
      document.documentElement.style.setProperty(
        `--mcp-safe-area-host-${side}`,
        `${host[side]}px`,
      );
      document.documentElement.style.setProperty(
        `--mcp-safe-area-min-${side}`,
        `${min[side]}px`,
      );
      document.documentElement.style.setProperty(
        `--mcp-safe-area-${side}`,
        `${effective[side]}px`,
      );
    });
  }, [safeAreaInsets, platform, currentDisplayMode, hasInlineSafeAreaFallback]);

  const canRequestFullscreen =
    hostContext?.availableDisplayModes?.includes('fullscreen') ?? false;

  const requestFullscreen = useCallback(() => {
    void bridge.requestDisplayMode('fullscreen');
  }, []);

  return {
    isFillHeight: displayMode === 'pip' || displayMode === 'fullscreen',
    isFullscreen: displayMode === 'fullscreen',
    canRequestFullscreen,
    requestFullscreen,
    locale: hostContext?.locale,
    hasInlineSafeAreaFallback,
  };
}
