import { useMemo } from "react";
import classNames from "classnames";
import { useSdmxData } from "./hooks/useSdmxData";
import { useHostLayout } from "./hooks/useHostLayout";
import { useHostTheme } from "./hooks/useHostTheme";
import { chartModelToGrid } from "./adapters/chartModelToGrid";
import { chartModelToChartingData } from "./adapters/chartModelToChartingData";
import { AppProviders } from "./components/AppProviders";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { ATTACHMENT_TYPE } from "./constants/attachmentTypes";
import { DataView } from "./components/DataView";
import { ErrorBanner } from "./components/ErrorBanner";

export default function App() {
    const { snapshot, meta, model, error } = useSdmxData();

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

    return (
        <AppProviders>
            {snapshot.phase !== "ready" ? (
                <ConnectionStatus
                    phase={snapshot.phase}
                    lastError={snapshot.lastError}
                />
            ) : (
                <div
                    className={classNames("flex flex-col gap-4 p-4", {
                        "h-full": isFillHeight,
                    })}
                >
                    {error && <ErrorBanner message={error} />}

                    <DataView
                        gridAttachment={gridAttachment}
                        chartAttachment={chartAttachment}
                        fillHeight={isFillHeight}
                    />
                </div>
            )}
        </AppProviders>
    );
}
