const BLOCK_COUNT = 16;

/**
 * Skeleton placeholder shown before data is ready — a title bar followed by a
 * 4x4 grid of pill blocks, both swept by a single shimmer highlight that
 * moves across the whole component in one motion. Used both while connecting
 * to the host and while waiting for the first tool result, replacing the
 * previous spinner.
 */
export function MainPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="relative flex w-full flex-col gap-4 overflow-hidden"
    >
      <div
        data-testid="placeholder-title"
        className="h-4 w-2/5 rounded-lg bg-neutrals-500"
      />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: BLOCK_COUNT }, (_, index) => (
          <div
            key={index}
            data-testid="placeholder-block"
            className="h-6 rounded-lg bg-neutrals-500"
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 animate-shimmer-sweep bg-[linear-gradient(90deg,transparent_0%,transparent_12%,rgba(255,255,255,0.75)_50%,transparent_88%,transparent_100%)]"
      />
    </div>
  );
}
