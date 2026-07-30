import { DisplayMode, HostKind, Platform } from './hostContext';

export type SafeAreaSides = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export const ZERO_SAFE_AREA: SafeAreaSides = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

const DEFAULT_MIN_SAFE_AREA: Record<DisplayMode, SafeAreaSides> = {
  inline: { ...ZERO_SAFE_AREA },
  fullscreen: { ...ZERO_SAFE_AREA },
  pip: { ...ZERO_SAFE_AREA },
};

export type SafeAreaOverrides = Partial<
  Record<
    HostKind,
    Partial<
      Record<Platform, Partial<Record<DisplayMode, Partial<SafeAreaSides>>>>
    >
  >
>;

const MIN_SAFE_AREA_OVERRIDES: SafeAreaOverrides = {
  [HostKind.Claude]: {
    [Platform.Mobile]: {
      [DisplayMode.Fullscreen]: { top: 8, right: 8, bottom: 8, left: 8 },
    },
  },
  [HostKind.ChatGpt]: {
    [Platform.Mobile]: {
      [DisplayMode.Fullscreen]: { top: 8, right: 8, bottom: 8, left: 8 },
    },
    [Platform.Desktop]: {
      [DisplayMode.Fullscreen]: { top: 16, right: 16, bottom: 140, left: 16 },
    },
  },
};

/**
 * Resolves the widget's own minimum safe-area padding for a given
 * (host, platform, displayMode) cell, applying any configured override on
 * top of the per-display-mode default.
 * @param hostKind - Which AI host is running the widget.
 * @param platform - Desktop/mobile bucket for that host.
 * @param displayMode - Current display mode.
 * @param overrides - Override table to resolve against; defaults to the module's configured overrides.
 */
export function resolveMinSafeArea(
  hostKind: HostKind,
  platform: Platform,
  displayMode: DisplayMode,
  overrides: SafeAreaOverrides = MIN_SAFE_AREA_OVERRIDES,
): SafeAreaSides {
  const base = DEFAULT_MIN_SAFE_AREA[displayMode];
  const override = overrides[hostKind]?.[platform]?.[displayMode];
  return { ...base, ...override };
}

/**
 * Combines the host-reported safe-area insets with the widget's own
 * minimum, taking the larger value per side.
 * @param host - Raw `hostContext.safeAreaInsets` values (0 for any side the host didn't report).
 * @param min - The widget's resolved minimum for the current cell.
 */
export function resolveEffectiveSafeArea(
  host: SafeAreaSides,
  min: SafeAreaSides,
): SafeAreaSides {
  return {
    top: Math.max(host.top, min.top),
    right: Math.max(host.right, min.right),
    bottom: Math.max(host.bottom, min.bottom),
    left: Math.max(host.left, min.left),
  };
}
