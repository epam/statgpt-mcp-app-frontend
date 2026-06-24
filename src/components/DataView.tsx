import { useState } from "react";
import classNames from "classnames";
import {
    CustomChartAttachment,
    CustomDataGridAttachment,
    CrossDatasetGridAttachment,
} from "@epam/statgpt-conversation-view";
import type { ChartingData, GridData } from "@epam/statgpt-conversation-view";
import type { ColDef } from "ag-grid-community";
import { ATTACHMENT_TYPE } from "../constants/attachmentTypes";

type Tab = "grid" | "chart" | "cross-grid";

interface GridAttachment {
    type: typeof ATTACHMENT_TYPE.CUSTOM_DATA_GRID;
    title: string;
    grid_data?: { data: GridData[]; columns: ColDef[] };
}

interface ChartAttachment {
    type: typeof ATTACHMENT_TYPE.CUSTOM_CHART;
    title: string;
    charting_data?: ChartingData;
}

interface CrossDatasetGridAttachmentData {
    data: GridData[];
    columns: ColDef[];
}

interface Props {
    gridAttachment: GridAttachment | undefined;
    chartAttachment: ChartAttachment | undefined;
    crossDatasetGridAttachment: CrossDatasetGridAttachmentData | undefined;
    fillHeight?: boolean;
}

const TAB_LABELS: Record<Tab, string> = {
    "grid": "Grid",
    "chart": "Chart",
    "cross-grid": "Cross Dataset Grid",
};

export function DataView({ gridAttachment, chartAttachment, crossDatasetGridAttachment, fillHeight }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("grid");

    if (!gridAttachment && !chartAttachment && !crossDatasetGridAttachment) return null;

    const availableTabs: Tab[] = [
        ...(gridAttachment ? ["grid" as Tab] : []),
        ...(chartAttachment ? ["chart" as Tab] : []),
        ...(crossDatasetGridAttachment ? ["cross-grid" as Tab] : []),
    ];

    const crossDatasetAttachment = crossDatasetGridAttachment
        ? { type: ATTACHMENT_TYPE.CROSS_DATASET_GRID, title: "Cross Dataset Grid", gridContent: crossDatasetGridAttachment }
        : undefined;

    return (
        <div className={classNames("flex flex-col gap-4", { "flex-1 min-h-0": fillHeight })}>
            <div className="flex border-b border-neutrals-400">
                {availableTabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={classNames(
                            "px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors",
                            activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-neutrals-700 hover:text-neutrals-1000",
                        )}
                    >
                        {TAB_LABELS[tab]}
                    </button>
                ))}
            </div>

            <div className={classNames({ "flex-1 min-h-0": fillHeight })}>
                {activeTab === "grid" && gridAttachment && (
                    <CustomDataGridAttachment
                        attachment={gridAttachment}
                        fillHeight={fillHeight}
                        fixHeight={!fillHeight}
                    />
                )}
                {activeTab === "chart" && chartAttachment && (
                    <CustomChartAttachment
                        attachment={chartAttachment}
                        fillHeight={fillHeight}
                        fixHeight={!fillHeight}
                    />
                )}
                {activeTab === "cross-grid" && crossDatasetAttachment && (
                    <CrossDatasetGridAttachment
                        attachment={crossDatasetAttachment}
                        fixHeight={!fillHeight}
                    />
                )}
            </div>
        </div>
    );
}
