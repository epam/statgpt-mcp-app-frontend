import { useState } from "react";
import {
  CustomChartAttachment,
  CustomDataGridAttachment,
} from "@epam/statgpt-conversation-view";
import type { ChartingData, GridData } from "@epam/statgpt-conversation-view";
import type { ColDef } from "ag-grid-community";

type Tab = "grid" | "chart";

interface GridAttachment {
  type: "custom_data_grid";
  title: string;
  grid_data?: { data: GridData[]; columns: ColDef[] };
}

interface ChartAttachment {
  type: "custom_chart";
  title: string;
  charting_data?: ChartingData;
}

interface Props {
  gridAttachment: GridAttachment | undefined;
  chartAttachment: ChartAttachment | undefined;
}

export function DataView({ gridAttachment, chartAttachment }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("grid");

  if (!gridAttachment && !chartAttachment) return null;

  return (
    <div className="flex flex-col gap-4">
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

      {activeTab === "grid" && gridAttachment && (
        <CustomDataGridAttachment attachment={gridAttachment} />
      )}
      {activeTab === "chart" && chartAttachment && (
        <CustomChartAttachment attachment={chartAttachment} />
      )}
    </div>
  );
}
