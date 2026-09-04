import classNames from 'classnames';

interface Props {
  message: string;
  /** Adds the widget's mobile edge margin when also `isInline`. */
  isMobile?: boolean;
  /** True outside pip/fullscreen, where the widget supplies its own margin instead. */
  isInline?: boolean;
}

/**
 * Renders an error message in a styled box using semantic error colors.
 *
 * @example
 * ```tsx
 * <ErrorBanner message="Failed to load data." />
 * ```
 *
 * @param message - Error text to display inside the banner.
 * @param isMobile - See `Props.isMobile`.
 * @param isInline - See `Props.isInline`.
 */
export function ErrorBanner({ message, isMobile, isInline }: Props) {
  return (
    <div
      className={classNames(
        'rounded border border-semantic-error bg-semantic-error-light px-3 py-2 text-sm text-semantic-error',
        { 'mx-4 my-3': isMobile && isInline },
      )}
    >
      {message}
    </div>
  );
}
