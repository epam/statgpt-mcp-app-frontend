import { Button } from "@epam/statgpt-ui-components";
import type { ChartMeta } from "../sdmx/parse";
import { frequencyLabel } from "../utils/frequency";

interface Props {
  meta: ChartMeta | null;
  loading: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
}

export function ExplorerHeader({ meta, loading, canRefresh, onRefresh }: Props) {
  const subtitle =
    [meta?.countryName || meta?.country, meta?.unit, frequencyLabel(meta?.frequency)]
      .filter(Boolean)
      .join(" · ") || "Waiting for chart data…";

  return (
    <header className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold text-neutrals-1000">
          {meta?.title || "SDMX Data Explorer"}
        </h1>
        <p className="text-sm text-neutrals-700">{subtitle}</p>
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
