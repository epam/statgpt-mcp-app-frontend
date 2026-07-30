import { useCallback, useEffect } from 'react';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import { bridge } from '../bridge';
import {
  detectHostKind,
  useDisplayMode,
  usePlatform,
} from '../host/hostContext';
import { resolveEffectiveSafeArea, resolveMinSafeArea } from '../host/safeArea';

export interface HostLayout {
  isFillHeight: boolean;
  isFullscreen: boolean;
  canRequestFullscreen: boolean;
  requestFullscreen: () => void;
  locale: string | undefined;
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
  }, [safeAreaInsets, platform, currentDisplayMode]);

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
  };
}
