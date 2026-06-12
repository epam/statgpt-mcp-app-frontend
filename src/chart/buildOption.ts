import type { EChartsOption } from "echarts";
import type { ChartMeta, ChartModel } from "../sdmx/parse";

// echarts option for a time-series line chart. Mirrors the structure of
// conversation-view's buildChartConfig (category x-axis from the time
// periods, one line series per row), kept minimal for the explorer.
export function buildChartOption(model: ChartModel, meta: ChartMeta | null): EChartsOption {
  return {
    animation: false,
    color: ["#414fff", "#0094ff", "#6843e9", "#00cc6f", "#d4c000", "#d6323e"],
    tooltip: { trigger: "axis" },
    legend: { bottom: 0, type: "scroll" },
    grid: { left: "3%", right: "4%", top: 24, bottom: 48, containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: model.periods,
    },
    yAxis: {
      type: "value",
      name: meta?.unit,
      nameLocation: "end",
      nameGap: 16,
    },
    series: model.series.map((s) => ({
      name: s.name,
      type: "line",
      smooth: false,
      showSymbol: model.periods.length <= 40,
      connectNulls: false,
      data: s.data,
    })),
  };
}
