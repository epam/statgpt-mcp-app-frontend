import { detectHostKind } from '../detectHost';
import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';

type StyleVariables = NonNullable<McpUiHostContext['styles']>['variables'];

function ctxWithVariables(vars: Record<string, string>): McpUiHostContext {
  return { styles: { variables: vars as StyleVariables } };
}

describe('detectHostKind', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).openai;
  });

  describe('claude detection', () => {
    it('returns claude when hostContext carries styles.variables with entries', () => {
      expect(
        detectHostKind(
          ctxWithVariables({ '--color-background-primary': '#fff' }),
        ),
      ).toBe('claude');
    });

    it('returns claude even when window.openai is present (variables take priority)', () => {
      (window as unknown as Record<string, unknown>).openai = {};
      expect(
        detectHostKind(ctxWithVariables({ '--color-text-primary': '#000' })),
      ).toBe('claude');
    });
  });

  describe('chatgpt detection', () => {
    it('returns chatgpt when window.openai is present and no styles.variables', () => {
      (window as unknown as Record<string, unknown>).openai = {};
      expect(detectHostKind({ theme: 'light' })).toBe('chatgpt');
    });

    it('returns chatgpt when ctx is undefined and window.openai is present', () => {
      (window as unknown as Record<string, unknown>).openai = {};
      expect(detectHostKind(undefined)).toBe('chatgpt');
    });

    it('returns chatgpt when styles.variables is an empty object', () => {
      (window as unknown as Record<string, unknown>).openai = {};
      expect(detectHostKind(ctxWithVariables({}))).toBe('chatgpt');
    });
  });

  describe('generic fallback', () => {
    it('returns generic when ctx is undefined and window.openai is absent', () => {
      expect(detectHostKind(undefined)).toBe('generic');
    });

    it('returns generic when ctx has no styles and window.openai is absent', () => {
      expect(detectHostKind({ theme: 'dark' })).toBe('generic');
    });

    it('returns generic when styles.variables is empty and window.openai is absent', () => {
      expect(detectHostKind(ctxWithVariables({}))).toBe('generic');
    });
  });
});
