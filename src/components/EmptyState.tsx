interface Props {
  message: string;
}

/**
 * Renders a neutral, non-alarming empty-state message for when a query
 * resolved but has nothing renderable to show. Unlike {@link ErrorBanner},
 * this is not boxed or colored as an error — it's a terminal, expected state.
 *
 * @example
 * ```tsx
 * <EmptyState message="No data returned for this query." />
 * ```
 *
 * @param message - Text explaining why there is nothing to display.
 */
export function EmptyState({ message }: Props) {
  return (
    <p className="max-w-md px-4 text-center text-sm text-neutrals-700">
      {message}
    </p>
  );
}
