import { renderHook, act } from '@testing-library/react';
import { useHostTheme } from '../useHostTheme';

vi.mock('@modelcontextprotocol/ext-apps', () => ({
  applyDocumentTheme: vi.fn(),
  applyHostStyleVariables: vi.fn(),
}));

import {
  applyDocumentTheme,
  applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';

describe('useHostTheme', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.head.querySelectorAll('style').forEach((el) => el.remove());
  });

  describe('theme', () => {
    it('calls applyDocumentTheme with the theme string when theme is set', () => {
      renderHook(() =>
        useHostTheme({ theme: 'dark', styles: { variables: {}, css: {} } }),
      );

      expect(vi.mocked(applyDocumentTheme)).toHaveBeenCalledWith('dark');
    });

    it('does not call applyDocumentTheme when theme is undefined', () => {
      renderHook(() =>
        useHostTheme({ styles: { variables: {}, css: {} } } as never),
      );

      expect(vi.mocked(applyDocumentTheme)).not.toHaveBeenCalled();
    });

    it('removes data-theme attribute from document.documentElement on unmount', () => {
      document.documentElement.setAttribute('data-theme', 'dark');

      const { unmount } = renderHook(() =>
        useHostTheme({ theme: 'dark', styles: { variables: {}, css: {} } }),
      );

      unmount();

      expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    });

    it('removes color-scheme property from document.documentElement.style on unmount', () => {
      document.documentElement.style.setProperty('color-scheme', 'dark');

      const { unmount } = renderHook(() =>
        useHostTheme({ theme: 'dark', styles: { variables: {}, css: {} } }),
      );

      unmount();

      expect(
        document.documentElement.style.getPropertyValue('color-scheme'),
      ).toBe('');
    });
  });

  describe('variables', () => {
    it('calls applyHostStyleVariables with the variables object when variables are set', () => {
      const variables = {
        '--color-primary': '#fff',
        '--color-secondary': '#000',
      };

      renderHook(() =>
        useHostTheme({ styles: { variables, css: {} } } as never),
      );

      expect(vi.mocked(applyHostStyleVariables)).toHaveBeenCalledWith(
        variables,
      );
    });

    it('removes each variable key from document.documentElement.style on unmount', () => {
      const variables = {
        '--color-primary': '#fff',
        '--color-secondary': '#000',
      };
      document.documentElement.style.setProperty('--color-primary', '#fff');
      document.documentElement.style.setProperty('--color-secondary', '#000');

      const { unmount } = renderHook(() =>
        useHostTheme({ styles: { variables, css: {} } } as never),
      );

      unmount();

      expect(
        document.documentElement.style.getPropertyValue('--color-primary'),
      ).toBe('');
      expect(
        document.documentElement.style.getPropertyValue('--color-secondary'),
      ).toBe('');
    });
  });

  describe('fontCss', () => {
    it('injects a <style> tag into document.head when fontCss is provided', () => {
      const stylesBefore = document.head.querySelectorAll('style').length;

      renderHook(() =>
        useHostTheme({
          styles: { variables: {}, css: { fonts: '@font-face {}' } },
        } as never),
      );

      expect(document.head.querySelectorAll('style').length).toBe(
        stylesBefore + 1,
      );
    });

    it('the injected <style> tag contains the correct CSS text', () => {
      const fontCss = '@font-face { font-family: "TestFont"; }';

      renderHook(() =>
        useHostTheme({
          styles: { variables: {}, css: { fonts: fontCss } },
        } as never),
      );

      const styleTag = document.head.querySelector('style');
      expect(styleTag?.textContent).toBe(fontCss);
    });

    it('removes the <style> tag on unmount', () => {
      const stylesBefore = document.head.querySelectorAll('style').length;

      const { unmount } = renderHook(() =>
        useHostTheme({
          styles: { variables: {}, css: { fonts: '@font-face {}' } },
        } as never),
      );

      unmount();

      expect(document.head.querySelectorAll('style').length).toBe(stylesBefore);
    });

    it('removes the existing <style> tag when fontCss becomes undefined', () => {
      const stylesBefore = document.head.querySelectorAll('style').length;

      const { rerender } = renderHook(
        ({ fontCss }: { fontCss: string | undefined }) =>
          useHostTheme({
            styles: { variables: {}, css: { fonts: fontCss } },
          } as never),
        { initialProps: { fontCss: '@font-face {}' } },
      );

      expect(document.head.querySelectorAll('style').length).toBe(
        stylesBefore + 1,
      );

      act(() => {
        rerender({ fontCss: undefined });
      });

      expect(document.head.querySelectorAll('style').length).toBe(stylesBefore);
    });
  });
});
