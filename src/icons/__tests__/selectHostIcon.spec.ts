import { HostKind, Platform } from '../../host/hostContext';
import { selectHostIcon } from '../selectHostIcon';

describe('selectHostIcon', () => {
  const variants = {
    chatgpt: 'chatgpt-icon',
    claudeDesktop: 'claude-desktop-icon',
    claudeMobile: 'claude-mobile-icon',
  };

  it('returns the chatgpt variant for chatgpt + desktop', () => {
    expect(selectHostIcon(HostKind.ChatGpt, Platform.Desktop, variants)).toBe(
      'chatgpt-icon',
    );
  });

  it('returns the chatgpt variant for chatgpt + mobile', () => {
    expect(selectHostIcon(HostKind.ChatGpt, Platform.Mobile, variants)).toBe(
      'chatgpt-icon',
    );
  });

  it('returns the claude desktop variant for claude + desktop', () => {
    expect(selectHostIcon(HostKind.Claude, Platform.Desktop, variants)).toBe(
      'claude-desktop-icon',
    );
  });

  it('returns the claude mobile variant for claude + mobile', () => {
    expect(selectHostIcon(HostKind.Claude, Platform.Mobile, variants)).toBe(
      'claude-mobile-icon',
    );
  });
});
