import type { ChartingData, ChartUnit } from "@epam/statgpt-conversation-view";
import type { ChartModel } from "../sdmx/parse";

export function chartModelToChartingData(
  model: ChartModel,
  meta: { unit?: string } | null,
): ChartingData {
  if (model.periods.length === 0 || model.series.length === 0) {
    return { units: [] };
  }

  const units: ChartUnit[] = model.series.map((s) => ({
    config: {
      animation: false,
      tooltip: { trigger: "axis" },
      legend: { bottom: 0, type: "scroll", data: [s.name] },
      grid: { left: "3%", right: "4%", top: 24, bottom: 48, containLabel: true },
      xAxis: { type: "category", boundaryGap: false, data: model.periods },
      yAxis: { type: "value", name: meta?.unit, nameLocation: "end", nameGap: 16 },
      series: [
        {
          type: "line",
          name: s.name,
          data: s.data,
          smooth: false,
          showSymbol: model.periods.length <= 40,
          connectNulls: false,
        },
      ],
    },
    dimensions: [],
    isPlottable: true,
    rows: [],
    limitedByRowsAmountTo: undefined,
  }));

  return { units };
}
