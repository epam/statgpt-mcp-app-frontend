import { Button } from '@epam/statgpt-ui-components';
import type { WidgetMeta } from '../bridge/types';

interface Props {
  meta: WidgetMeta | null;
  loading: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
}

/**
 * ExplorerHeader renders the page header containing a dataset title, an optional
 * subtitle, and a Refresh button.
 *
 * When `meta` is `null` or `meta.title` is empty, the title falls back to
 * "SDMX Data Explorer" and a "Waiting for chart data…" subtitle is shown below
 * it to signal that chart metadata has not yet arrived. Once a title is available
 * the subtitle disappears. The Refresh button is disabled whenever `loading` is
 * `true` or `canRefresh` is `false`.
 *
 * @example
 * ```tsx
 * <ExplorerHeader
 *   meta={null}
 *   loading={true}
 *   canRefresh={false}
 *   onRefresh={() => {}}
 * />
 * ```
 *
 * @param meta - Parsed widget metadata containing the dataset title, or `null`
 *   while metadata is unavailable.
 * @param loading - Whether a data-fetch operation is in progress; disables the
 *   Refresh button and shows its loading indicator when `true`.
 * @param canRefresh - Whether a refresh action is currently possible; the Refresh
 *   button is disabled when `false`.
 * @param onRefresh - Callback invoked when the user clicks the Refresh button.
 */
export function ExplorerHeader({
  meta,
  loading,
  canRefresh,
  onRefresh,
}: Props) {
  const subtitle = meta?.title ? undefined : 'Waiting for chart data…';

  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutrals-1000">
          {meta?.title || 'SDMX Data Explorer'}
        </h1>
        {subtitle && <p className="text-sm text-neutrals-700">{subtitle}</p>}
      </div>
      <Button
        title="Refresh"
        buttonClassName="bg-primary text-white rounded px-4 py-2 hover:opacity-90"
        isSmallButton
        isLoading={loading}
        disabled={!canRefresh || loading}
        onClick={onRefresh}
      />
    </header>
  );
}
