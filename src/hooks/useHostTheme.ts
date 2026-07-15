import { useEffect, useRef } from 'react';
import {
  applyDocumentTheme,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';

/**
 * Applies the host's theme, CSS variable overrides, and font styles to the document, removing them on unmount.
 */
export function useHostTheme(hostContext: McpUiHostContext | undefined): void {
  const theme = hostContext?.theme;
  const variables = hostContext?.styles?.variables;
  const fontCss = hostContext?.styles?.css?.fonts;
  const fontStyleRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    // A host that omits `theme` is left on the browser's default color
    // scheme, which resolves to light — an intentional light-only fallback,
    // not an oversight.
    if (!theme) return;
    applyDocumentTheme(theme);
    return () => {
      document.documentElement.removeAttribute('data-theme');
      document.documentElement.style.removeProperty('color-scheme');
    };
  }, [theme]);

  useEffect(() => {
    if (!variables) return;
    applyHostStyleVariables(variables);
    return () => {
      Object.keys(variables).forEach((key) => {
        document.documentElement.style.removeProperty(key);
      });
    };
  }, [variables]);

  useEffect(() => {
    if (!fontCss) {
      fontStyleRef.current?.remove();
      fontStyleRef.current = null;
      return;
    }
    if (!fontStyleRef.current) {
      fontStyleRef.current = document.createElement('style');
      document.head.appendChild(fontStyleRef.current);
    }
    fontStyleRef.current.textContent = fontCss;
    return () => {
      fontStyleRef.current?.remove();
      fontStyleRef.current = null;
    };
  }, [fontCss]);
}
