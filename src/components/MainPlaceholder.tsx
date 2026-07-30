const BLOCK_COUNT = 16;

/**
 * Skeleton placeholder shown before data is ready — a title bar followed by a
 * 4x4 grid of pulsing pill blocks. Used both while connecting to the host and
 * while waiting for the first tool result, replacing the previous spinner.
 */
export function MainPlaceholder() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex w-full flex-col gap-4"
    >
      <div
        data-testid="placeholder-title"
        className="h-4 w-2/5 animate-pulse rounded-lg bg-neutrals-500"
      />
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: BLOCK_COUNT }, (_, index) => (
          <div
            key={index}
            data-testid="placeholder-block"
            className="h-6 animate-pulse rounded-lg bg-neutrals-500"
          />
        ))}
      </div>
    </div>
  );
}
