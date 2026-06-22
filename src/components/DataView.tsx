import { useState } from "react";
import {
    CustomChartAttachment,
    CustomDataGridAttachment,
} from "@epam/statgpt-conversation-view";
import type { ChartingData, GridData } from "@epam/statgpt-conversation-view";
import type { ColDef } from "ag-grid-community";
import { ATTACHMENT_TYPE } from "../constants/attachmentTypes";

type Tab = "grid" | "chart";

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

interface Props {
    gridAttachment: GridAttachment | undefined;
    chartAttachment: ChartAttachment | undefined;
    fillHeight?: boolean;
}

export function DataView({ gridAttachment, chartAttachment, fillHeight }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>("grid");

    if (!gridAttachment && !chartAttachment) return null;

    return (
        <div className={fillHeight ? "flex flex-col flex-1 min-h-0 gap-4" : "flex flex-col gap-4"}>
            <div className="flex border-b border-neutrals-400">
                {(["grid", "chart"] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={[
                            "px-4 py-2 text-sm font-medium capitalize -mb-px border-b-2 transition-colors",
                            activeTab === tab
                                ? "border-primary text-primary"
                                : "border-transparent text-neutrals-700 hover:text-neutrals-1000",
                        ].join(" ")}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className={fillHeight ? "flex-1 min-h-0" : ""}>
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
            </div>
        </div>
    );
}
