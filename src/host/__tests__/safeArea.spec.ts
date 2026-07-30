import { DisplayMode, HostKind, Platform } from '../hostContext';
import {
  resolveEffectiveSafeArea,
  resolveMinSafeArea,
  ZERO_SAFE_AREA,
  type SafeAreaOverrides,
} from '../safeArea';

describe('resolveMinSafeArea', () => {
  it('returns the all-zero default for a (host, platform, displayMode) cell with no override', () => {
    const overrides: SafeAreaOverrides = {};
    expect(
      resolveMinSafeArea(
        HostKind.Claude,
        Platform.Mobile,
        DisplayMode.Fullscreen,
        overrides,
      ),
    ).toEqual(ZERO_SAFE_AREA);
    expect(
      resolveMinSafeArea(
        HostKind.ChatGpt,
        Platform.Desktop,
        DisplayMode.Inline,
        overrides,
      ),
    ).toEqual(ZERO_SAFE_AREA);
  });

  it('applies an override for a specific (host, platform, displayMode) cell', () => {
    const overrides: SafeAreaOverrides = {
      [HostKind.Claude]: {
        [Platform.Mobile]: {
          [DisplayMode.Fullscreen]: { bottom: 24 },
        },
      },
    };

    const result = resolveMinSafeArea(
      HostKind.Claude,
      Platform.Mobile,
      DisplayMode.Fullscreen,
      overrides,
    );

    expect(result).toEqual({ top: 0, right: 0, bottom: 24, left: 0 });
  });

  it('does not apply an override to a different (host, platform, displayMode) cell', () => {
    const overrides: SafeAreaOverrides = {
      [HostKind.Claude]: {
        [Platform.Mobile]: {
          [DisplayMode.Fullscreen]: { bottom: 24 },
        },
      },
    };

    const result = resolveMinSafeArea(
      HostKind.Claude,
      Platform.Desktop,
      DisplayMode.Fullscreen,
      overrides,
    );

    expect(result).toEqual(ZERO_SAFE_AREA);
  });
});

describe('resolveMinSafeArea — production overrides', () => {
  it('gives Claude mobile fullscreen an 8px minimum on all sides', () => {
    expect(
      resolveMinSafeArea(
        HostKind.Claude,
        Platform.Mobile,
        DisplayMode.Fullscreen,
      ),
    ).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
  });

  it('gives ChatGPT mobile fullscreen an 8px minimum on all sides', () => {
    expect(
      resolveMinSafeArea(
        HostKind.ChatGpt,
        Platform.Mobile,
        DisplayMode.Fullscreen,
      ),
    ).toEqual({ top: 8, right: 8, bottom: 8, left: 8 });
  });

  it('gives ChatGPT desktop fullscreen 16px top/right/left and 140px bottom', () => {
    expect(
      resolveMinSafeArea(
        HostKind.ChatGpt,
        Platform.Desktop,
        DisplayMode.Fullscreen,
      ),
    ).toEqual({ top: 16, right: 16, bottom: 140, left: 16 });
  });

  it('leaves Claude desktop fullscreen at the all-zero default', () => {
    expect(
      resolveMinSafeArea(
        HostKind.Claude,
        Platform.Desktop,
        DisplayMode.Fullscreen,
      ),
    ).toEqual(ZERO_SAFE_AREA);
  });

  it('leaves inline and pip modes at the all-zero default for every host/platform', () => {
    expect(
      resolveMinSafeArea(HostKind.Claude, Platform.Mobile, DisplayMode.Inline),
    ).toEqual(ZERO_SAFE_AREA);
    expect(
      resolveMinSafeArea(HostKind.ChatGpt, Platform.Mobile, DisplayMode.Pip),
    ).toEqual(ZERO_SAFE_AREA);
  });
});

describe('resolveEffectiveSafeArea', () => {
  it('takes the larger value per side, independently', () => {
    const host = { top: 44, right: 0, bottom: 0, left: 5 };
    const min = { top: 0, right: 8, bottom: 34, left: 5 };

    expect(resolveEffectiveSafeArea(host, min)).toEqual({
      top: 44,
      right: 8,
      bottom: 34,
      left: 5,
    });
  });

  it('preserves a host value that already exceeds the minimum', () => {
    const host = { top: 100, right: 100, bottom: 100, left: 100 };
    const min = { top: 16, right: 16, bottom: 16, left: 16 };

    expect(resolveEffectiveSafeArea(host, min)).toEqual(host);
  });
});
