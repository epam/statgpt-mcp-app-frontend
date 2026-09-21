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

/**
 * Widget-defined default padding for inline mode when the host reports no
 * `safeAreaInsets` at all. Applied as a true fallback (see
 * `shouldUseInlineAbsentFallback`), not merged via `resolveEffectiveSafeArea`
 * — a host that reports a real value, even all-zero, is left untouched.
 */
export const INLINE_ABSENT_SAFE_AREA_FALLBACK: Record<Platform, SafeAreaSides> =
  {
    [Platform.Desktop]: { top: 12, right: 12, bottom: 12, left: 12 },
    [Platform.Mobile]: { top: 8, right: 8, bottom: 8, left: 8 },
  };

/**
 * Whether the inline-mode absent-insets fallback should apply: the host
 * isn't ChatGPT, the display mode is inline, and the host reported no
 * `safeAreaInsets` at all (as opposed to reporting a real, even all-zero,
 * value). Callers must additionally confirm the host handshake has actually
 * completed (i.e. `hostContext` itself is defined) before using this
 * result — `safeAreaInsets` is indistinguishable from "not reported" both
 * before the handshake and when a host genuinely never reports one, and
 * only the latter should trigger the fallback.
 * @param hostKind - Result of `detectHostKind()` for the current host.
 * @param displayMode - Current resolved display mode.
 * @param safeAreaInsets - Raw `hostContext.safeAreaInsets`, `undefined` if the host didn't report one.
 */
export function shouldUseInlineAbsentFallback(
  hostKind: HostKind,
  displayMode: DisplayMode,
  safeAreaInsets: SafeAreaSides | undefined,
): boolean {
  return (
    hostKind !== HostKind.ChatGpt &&
    displayMode === DisplayMode.Inline &&
    safeAreaInsets === undefined
  );
}
