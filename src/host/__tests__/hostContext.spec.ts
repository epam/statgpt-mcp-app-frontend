import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import {
  detectHostKind,
  HostKind,
  Platform,
  usePlatform,
} from '../hostContext';

function makeHostContext(
  overrides: Partial<McpUiHostContext> = {},
): McpUiHostContext {
  return overrides as McpUiHostContext;
}

describe('detectHostKind', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('returns HostKind.ChatGpt when window.openai is defined', () => {
    (window as unknown as { openai?: unknown }).openai = {};
    expect(detectHostKind()).toBe(HostKind.ChatGpt);
  });

  it('returns HostKind.Claude when window.openai is undefined', () => {
    delete (window as unknown as { openai?: unknown }).openai;
    expect(detectHostKind()).toBe(HostKind.Claude);
  });
});

describe('usePlatform', () => {
  it('returns Platform.Mobile when hostContext.platform is "mobile"', () => {
    expect(usePlatform(makeHostContext({ platform: 'mobile' }))).toBe(
      Platform.Mobile,
    );
  });

  it('returns Platform.Desktop when hostContext.platform is "desktop"', () => {
    expect(usePlatform(makeHostContext({ platform: 'desktop' }))).toBe(
      Platform.Desktop,
    );
  });

  it('returns Platform.Desktop when hostContext.platform is "web"', () => {
    expect(usePlatform(makeHostContext({ platform: 'web' }))).toBe(
      Platform.Desktop,
    );
  });

  it('returns Platform.Desktop when hostContext is undefined', () => {
    expect(usePlatform(undefined)).toBe(Platform.Desktop);
  });
});
