import type { McpUiHostContext } from '@modelcontextprotocol/ext-apps';
import {
  detectHostKind,
  DisplayMode,
  HostKind,
  Platform,
  usePlatform,
  useDisplayMode,
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

describe('useDisplayMode', () => {
  it('returns DisplayMode.Fullscreen when hostContext.displayMode is "fullscreen"', () => {
    expect(useDisplayMode(makeHostContext({ displayMode: 'fullscreen' }))).toBe(
      DisplayMode.Fullscreen,
    );
  });

  it('returns DisplayMode.Pip when hostContext.displayMode is "pip"', () => {
    expect(useDisplayMode(makeHostContext({ displayMode: 'pip' }))).toBe(
      DisplayMode.Pip,
    );
  });

  it('returns DisplayMode.Inline when hostContext.displayMode is "inline"', () => {
    expect(useDisplayMode(makeHostContext({ displayMode: 'inline' }))).toBe(
      DisplayMode.Inline,
    );
  });

  it('returns DisplayMode.Inline when displayMode is not set', () => {
    expect(useDisplayMode(makeHostContext())).toBe(DisplayMode.Inline);
  });

  it('returns DisplayMode.Inline when hostContext is undefined', () => {
    expect(useDisplayMode(undefined)).toBe(DisplayMode.Inline);
  });
});
