import { Platform } from '../host/hostContext';

/** Visible data rows in inline mode before the rest is only reachable via fullscreen. */
export const INLINE_GRID_ROW_CAP: Record<Platform, number> = {
  [Platform.Desktop]: 6,
  [Platform.Mobile]: 3,
};

/** Hard cap on inline-reachable column slides — always exactly this many at most, both platforms. */
export const MAX_INLINE_SLIDES = 2;

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

/**
 * Shared "there's more than what's shown" hint text — the vertical overlay
 * hint and the plain duplicate line below the grid (both rendered by
 * `GridSlideNav`, identically on both platforms) render this exact copy, so
 * it lives in one place instead of two.
 */
export const INLINE_GRID_NUDGE_TEXT = 'To view more, open full view';
