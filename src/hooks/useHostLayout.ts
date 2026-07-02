import { useEffect } from 'react';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';

export interface HostLayout {
  isFillHeight: boolean;
  isFullscreen: boolean;
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
  useEffect(() => {
    (['top', 'right', 'bottom', 'left'] as const).forEach((side) => {
      const value = safeAreaInsets?.[side];
      const prop = `--mcp-safe-area-${side}`;
      if (value != null && value > 0) {
        document.documentElement.style.setProperty(prop, `${value}px`);
      } else {
        document.documentElement.style.removeProperty(prop);
      }
    });
  }, [safeAreaInsets]);

  return {
    isFillHeight: displayMode === 'pip' || displayMode === 'fullscreen',
    isFullscreen: displayMode === 'fullscreen',
    locale: hostContext?.locale,
  };
}
