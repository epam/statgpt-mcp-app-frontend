import { useMemo } from "react";
import classNames from "classnames";
import { useSdmxData } from "./hooks/useSdmxData";
import { useHostLayout } from "./hooks/useHostLayout";
import { useHostTheme } from "./hooks/useHostTheme";
import { chartModelToGrid } from "./adapters/chartModelToGrid";
import { chartModelToChartingData } from "./adapters/chartModelToChartingData";
import { chartModelToCrossDatasetGrid } from "./adapters/chartModelToCrossDatasetGrid";
import { AppProviders } from "./components/AppProviders";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { Loader } from "./components/Loader";
import { ATTACHMENT_TYPE } from "./constants/attachmentTypes";
import { DataView } from "./components/DataView";
import { ErrorBanner } from "./components/ErrorBanner";

export default function App() {
    const { snapshot, meta, model, loading, error } = useSdmxData();

    useHostTheme(snapshot.hostContext);
    const { isFillHeight } = useHostLayout(snapshot.hostContext);

    const gridAttachment = useMemo(() => {
        if (!model) return undefined;
        return {
            type: ATTACHMENT_TYPE.CUSTOM_DATA_GRID,
            title: meta?.title ?? "Data",
            grid_data: chartModelToGrid(model, null),
        };
    }, [model, meta]);

    const chartAttachment = useMemo(() => {
        if (!model) return undefined;
        return {
            type: ATTACHMENT_TYPE.CUSTOM_CHART,
            title: meta?.title ?? "Chart",
            charting_data: chartModelToChartingData(model, null),
        };
    }, [model, meta]);

    const crossDatasetGridAttachment = useMemo(() => {
        if (!model) return undefined;
        return chartModelToCrossDatasetGrid(model, null);
    }, [model]);

    return (
        <AppProviders>
            {snapshot.phase !== "ready" && snapshot.phase !== "tool-pending" ? (
                <ConnectionStatus
                    phase={snapshot.phase}
                    lastError={snapshot.lastError}
                />
            ) : (
                <div
                    className={classNames("flex flex-col gap-4 p-4", {
                        "h-full": isFillHeight,
                        "min-h-[var(--mcp-widget-min-height)]": !isFillHeight && loading && !model,
                    })}
                >
                    {error && <ErrorBanner message={error} />}

                    {loading && !model ? (
                        <div className="flex flex-1 items-center justify-center">
                            <Loader />
                        </div>
                    ) : (
                        <DataView
                            gridAttachment={gridAttachment}
                            chartAttachment={chartAttachment}
                            crossDatasetGridAttachment={
                                crossDatasetGridAttachment
                            }
                            fillHeight={isFillHeight}
                        />
                    )}
                </div>
            )}
        </AppProviders>
    );
}
