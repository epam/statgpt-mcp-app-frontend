import { Platform } from '../host/hostContext';

/**
 * Per-platform pixel size for host icons, shared across both Claude and
 * ChatGPT: desktop icons render at 20px, mobile icons at 24px.
 */
export const ICON_SIZE: Record<Platform, number> = {
  [Platform.Desktop]: 20,
  [Platform.Mobile]: 24,
};
