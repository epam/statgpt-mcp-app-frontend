/**
 * Static hardcoded header shown in fullscreen/pip in place of the
 * BE-provided `message`, for the two empty states backed by tabbed grids
 * (candidate datasets / missing dimensions, see `EmptyStateTabs`) — points
 * the user at the grids below instead of repeating the technical message
 * already shown in inline mode's `EmptyStateInlineNudge`.
 */
export function EmptyStateFullscreenHeader() {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-base font-semibold text-neutrals-1000">
        Browse available dimension
      </h2>
      <p className="text-sm text-neutrals-700">
        Find the exact name your query needs, then copy it back into your
        request.
      </p>
    </div>
  );
}
