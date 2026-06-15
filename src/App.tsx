import { useMemo } from "react";
import { useSdmxData } from "./hooks/useSdmxData";
import { chartModelToGrid } from "./adapters/chartModelToGrid";
import { chartModelToChartingData } from "./adapters/chartModelToChartingData";
import { AppProviders } from "./components/AppProviders";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { DataView } from "./components/DataView";
import { ErrorBanner } from "./components/ErrorBanner";
import { ExplorerHeader } from "./components/ExplorerHeader";
import { SupersededBanner } from "./components/SupersededBanner";

export default function App() {
    const { snapshot, meta, model, loading, error, canFetch, refresh } =
        useSdmxData();

    const gridAttachment = useMemo(() => {
        if (!model) return undefined;
        return {
            type: "custom_data_grid" as const,
            title: meta?.title ?? "Data",
            grid_data: chartModelToGrid(model, meta),
        };
    }, [model, meta]);

    const chartAttachment = useMemo(() => {
        if (!model) return undefined;
        return {
            type: "custom_chart" as const,
            title: meta?.title ?? "Chart",
            charting_data: chartModelToChartingData(model, meta),
        };
    }, [model, meta]);

    return (
        <AppProviders>
            {snapshot.phase !== "ready" ? (
                <ConnectionStatus
                    phase={snapshot.phase}
                    lastError={snapshot.lastError}
                />
            ) : (
                <div className="flex flex-col gap-4 p-4">
                    {snapshot.superseded && <SupersededBanner />}

                    <ExplorerHeader
                        meta={meta}
                        loading={loading}
                        canRefresh={canFetch}
                        onRefresh={refresh}
                    />

                    {error && <ErrorBanner message={error} />}

                    <DataView
                        gridAttachment={gridAttachment}
                        chartAttachment={chartAttachment}
                    />
                </div>
            )}
        </AppProviders>
    );
}
