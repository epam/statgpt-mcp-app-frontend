interface Props {
  message: string;
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
 */
export function ErrorBanner({ message }: Props) {
  return (
    <div className="rounded border border-semantic-error bg-semantic-error-light px-3 py-2 text-sm text-semantic-error">
      {message}
    </div>
  );
}
