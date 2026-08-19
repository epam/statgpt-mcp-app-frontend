/**
 * Tailwind classes for the skeleton-placeholder shimmer effect, shared by
 * `MainPlaceholder` and `CodePlaceholder`. Flat, unmixed `neutrals-500`
 * margins on both sides of the highlight band keep the `shimmer-wave`
 * animation's loop-reset seamless, and the wide ramp between each margin
 * and the peak reads as a soft glow rather than a hard-edged border.
 */
export const SHIMMER_CLASSES =
  'animate-shimmer-wave bg-[length:400%_100%] bg-[linear-gradient(90deg,var(--neutrals-500)_0%,var(--neutrals-500)_27%,var(--shimmer-highlight)_50%,var(--neutrals-500)_73%,var(--neutrals-500)_100%)]';
