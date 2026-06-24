import type { ChartModel, WidgetMeta } from "../sdmx/parse";

export const mockMeta: WidgetMeta = {
  title: "Germany — Real GDP Growth",
  queries: [
    {
      sdmx: {
        context: "dataflow",
        agency_id: "IMF.STA",
        resource_id: "QGDP",
        version: "1.0",
        key: "DEU.B1GQ.....",
        params: { startPeriod: "2010" },
      },
    },
  ],
  sdmxProxyToolName: "sdmx_proxy",
};

export const mockModel: ChartModel = {
  agencyId: "IMF.STA",
  datasetName: "Germany — Real GDP Growth (mock)",
  periods: [
    "2010", "2011", "2012", "2013", "2014", "2015",
    "2016", "2017", "2018", "2019", "2020", "2021",
    "2022", "2023", "2024",
  ],
  series: [
    {
      name: "DEU",
      dimensions: [
        { id: "COUNTRY", name: "Country", valueId: "DEU", valueName: "Germany" },
        { id: "INDICATOR", name: "Indicator", valueId: "B1GQ", valueName: "Real GDP Growth" },
        { id: "FREQUENCY", name: "Frequency", valueId: "A", valueName: "Annual" },
      ],
      data: [4.2, 3.9, 0.4, 0.4, 2.2, 1.5, 2.2, 2.6, 1.1, 1.1, -3.8, 3.2, 1.8, -0.3, 0.1],
    },
  ],
};
