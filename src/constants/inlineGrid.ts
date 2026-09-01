import { Platform } from '../host/hostContext';

/** Visible data rows in inline mode before the rest is only reachable via fullscreen. */
export const INLINE_GRID_ROW_CAP: Record<Platform, number> = {
  [Platform.Desktop]: 6,
  [Platform.Mobile]: 3,
};

/** Hard cap on inline-reachable column slides — always exactly this many at most, both platforms. */
export const MAX_INLINE_SLIDES = 3;

/**
 * Fixed inline-mode column widths, one first-pass value per platform per
 * column type — deliberately the SAME value on both platforms for now
 * (mobile no longer requests a narrower column just because `platform`
 * says mobile). The shared grid component this widget renders through
 * applies its own separate mobile column-width clamp based on the actual
 * viewport width, independent of `platform` — `gridColumnSlides.ts`'s
 * `viewportIsMobile` parameter predicts that clamp already, so it's no
 * longer this table's job to pre-emptively request a narrower width for
 * `Platform.Mobile`. Reasonable defaults, not measured against a design
 * file — tune here (single source of truth) once visually reviewed against
 * the real widget.
 */
export const INLINE_IDENTITY_COLUMN_WIDTH: Record<Platform, number> = {
  [Platform.Desktop]: 220,
  [Platform.Mobile]: 220,
};

export const INLINE_VALUE_COLUMN_WIDTH: Record<Platform, number> = {
  [Platform.Desktop]: 130,
  [Platform.Mobile]: 130,
};

/** Minimum net horizontal pointer delta (px) to register as a slide-changing swipe. */
export const SWIPE_THRESHOLD_PX = 40;
