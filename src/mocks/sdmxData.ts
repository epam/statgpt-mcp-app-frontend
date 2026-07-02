import type { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import type { WidgetMeta } from '../bridge/types';

export const mockMeta: WidgetMeta = {
  title: 'Germany — Real GDP Growth',
  queries: [
    {
      sdmx: {
        context: 'dataflow',
        agency_id: 'IMF.STA',
        resource_id: 'QGDP',
        version: '1.0',
        key: 'DEU.B1GQ.....',
        params: { startPeriod: '2010' },
      },
    },
  ],
  sdmxProxyToolName: 'sdmx_proxy',
};

export const mockStructuralData: StructuralData = {
  dataflows: [
    {
      id: 'QGDP',
      agencyID: 'IMF.STA',
      version: '1.0',
      name: 'Germany — Real GDP Growth (mock)',
    },
  ],
  dataStructures: [
    {
      id: 'DSD_QGDP',
      agencyID: 'IMF.STA',
      version: '1.0',
      dataStructureComponents: {
        dimensionList: {
          dimensions: [
            {
              id: 'COUNTRY',
              conceptIdentity:
                'urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=IMF.STA:CS_QGDP(1.0).COUNTRY',
              localRepresentation: {
                enumeration:
                  'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=IMF.STA:CL_COUNTRY(1.0)',
              },
            },
            {
              id: 'INDICATOR',
              conceptIdentity:
                'urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=IMF.STA:CS_QGDP(1.0).INDICATOR',
              localRepresentation: {
                enumeration:
                  'urn:sdmx:org.sdmx.infomodel.codelist.Codelist=IMF.STA:CL_INDICATOR(1.0)',
              },
            },
          ],
          timeDimensions: [
            {
              id: 'TIME_PERIOD',
              conceptIdentity:
                'urn:sdmx:org.sdmx.infomodel.conceptscheme.Concept=IMF.STA:CS_QGDP(1.0).TIME_PERIOD',
              localRepresentation: {},
            },
          ],
        },
        measureList: {},
        attributeList: { metadataAttributeUsages: [] },
      },
    },
  ],
  conceptSchemes: [
    {
      id: 'CS_QGDP',
      agencyID: 'IMF.STA',
      version: '1.0',
      concepts: [
        { id: 'COUNTRY', name: 'Country' },
        { id: 'INDICATOR', name: 'Indicator' },
        { id: 'TIME_PERIOD', name: 'Time Period' },
      ],
    },
  ],
  codelists: [
    {
      id: 'CL_COUNTRY',
      agencyID: 'IMF.STA',
      version: '1.0',
      codes: [{ id: 'DEU', name: 'Germany' }],
    },
    {
      id: 'CL_INDICATOR',
      agencyID: 'IMF.STA',
      version: '1.0',
      codes: [{ id: 'B1GQ', name: 'Real GDP Growth' }],
    },
  ],
};

const MOCK_PERIODS = [
  '2010',
  '2011',
  '2012',
  '2013',
  '2014',
  '2015',
  '2016',
  '2017',
  '2018',
  '2019',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
];

const MOCK_GDP_VALUES = [
  4.2, 3.9, 0.4, 0.4, 2.2, 1.5, 2.2, 2.6, 1.1, 1.1, -3.8, 3.2, 1.8, -0.3, 0.1,
];

export const mockDataMessage: DataMessage = {
  data: {
    structures: [
      {
        dimensions: {
          series: [
            { id: 'COUNTRY', values: [{ id: 'DEU', value: 'Germany' }] },
            {
              id: 'INDICATOR',
              values: [{ id: 'B1GQ', value: 'Real GDP Growth' }],
            },
          ],
          observation: [
            {
              id: 'TIME_PERIOD',
              values: MOCK_PERIODS.map((id) => ({ id })),
            },
          ],
        },
        measures: {
          observation: [{ id: 'OBS_VALUE', values: [] }],
        },
      },
    ],
    dataSets: [
      {
        series: {
          '0:0': {
            attributes: [],
            observations: Object.fromEntries(
              MOCK_GDP_VALUES.map((v, i) => [`${i}`, [v]]),
            ),
          },
        },
      },
    ],
  },
};
