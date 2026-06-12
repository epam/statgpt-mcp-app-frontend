import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

export function Chart({ option }: { option: EChartsOption }) {
  return (
    <ReactECharts
      notMerge
      lazyUpdate
      option={option}
      style={{ height: 360, width: "100%" }}
    />
  );
}
