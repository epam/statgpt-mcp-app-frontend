import { Platform } from '../host/hostContext';

/** Visible data rows in inline mode before the rest is only reachable via fullscreen. */
export const INLINE_GRID_ROW_CAP: Record<Platform, number> = {
  [Platform.Desktop]: 6,
  [Platform.Mobile]: 3,
};

/** Hard cap on inline-reachable column slides — always exactly this many at most, both platforms. */
export const MAX_INLINE_SLIDES = 3;

/**
 * Fixed inline-mode column widths, one first-pass value per column type —
 * the same on both platforms (the shared grid component this widget renders
 * through applies its own separate mobile column-width clamp based on the
 * actual viewport width, independent of `platform` — `gridColumnSlides.ts`'s
 * `viewportIsMobile` parameter predicts that clamp already, so it's not this
 * constant's job to narrow for mobile too). Reasonable defaults, not
 * measured against a design file — tune here (single source of truth) once
 * visually reviewed against the real widget.
 */
export const INLINE_IDENTITY_COLUMN_WIDTH = 220;

export const INLINE_VALUE_COLUMN_WIDTH = 130;

/** Minimum net horizontal pointer delta (px) to register as a slide-changing swipe. */
export const SWIPE_THRESHOLD_PX = 40;

/**
 * Shared "there's more than what's shown" hint text — the desktop vertical
 * overlay (`GridSlideNav`), mobile's reserved column (`MobileGridNudge`),
 * and both platforms' plain duplicate line below the grid (`DataView`) all
 * render this exact copy, so it lives in one place instead of three.
 */
export const INLINE_GRID_NUDGE_TEXT = 'To view more, open full view';

/**
 * Mobile's reserved "view more" column (`MobileGridNudge`) width, in px.
 * `DataView` measures the grid's width on a container that's stable across
 * slides (not the grid div itself, which shrinks when this column mounts
 * beside it on the last slide) and always subtracts this constant before
 * budgeting pages — even on slides where the column isn't currently shown —
 * so the page layout never depends on whether this column happens to be
 * mounted right now. `MobileGridNudge` sizes itself to this same constant,
 * so the two can never drift apart.
 */
export const MOBILE_GRID_NUDGE_COLUMN_WIDTH = 32;
