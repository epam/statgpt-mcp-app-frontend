import type { ChartMeta, ChartModel } from "../sdmx/parse";

export const mockMeta: ChartMeta = {
  title: "Germany — Real GDP Growth",
  unit: "% YoY",
  frequency: "A",
  country: "DEU",
  countryName: "Germany",
  query: { country: "DEU", indicator: "GDP_GROWTH" },
  fetchToolName: "fetch_sdmx_data",
};

export const mockModel: ChartModel = {
  periods: [
    "2010", "2011", "2012", "2013", "2014", "2015",
    "2016", "2017", "2018", "2019", "2020", "2021",
    "2022", "2023", "2024",
  ],
  series: [
    {
      name: "DEU",
      data: [4.2, 3.9, 0.4, 0.4, 2.2, 1.5, 2.2, 2.6, 1.1, 1.1, -3.8, 3.2, 1.8, -0.3, 0.1],
    },
  ],
};
