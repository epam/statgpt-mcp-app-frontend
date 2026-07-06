import type { DataMessage, StructuralData } from '@epam/statgpt-sdmx-toolkit';
import { QueryFilterType } from '@epam/statgpt-shared-toolkit';
import type { WidgetMeta } from '../bridge/types';

export const mockMeta: WidgetMeta = {
  title: 'Germany — Real GDP Growth',
  queries: [
    {
      urn: 'IMF.STA:QGDP(1.0)',
      filters: [
        {
          componentCode: 'COUNTRY',
          operator: QueryFilterType.IN,
          values: ['DEU'],
        },
        {
          componentCode: 'INDICATOR',
          operator: QueryFilterType.IN,
          values: ['B1GQ'],
        },
        {
          componentCode: 'TIME_PERIOD',
          operator: QueryFilterType.BETWEEN,
          values: ['2010-01-01', '2024-12-31'],
        },
      ],
      metadata: {
        countryDimension: 'COUNTRY',
        indicatorDimensions: ['INDICATOR'],
        timePeriodDimension: 'TIME_PERIOD',
        keyDimensionIdsInDsdOrder: ['COUNTRY', 'INDICATOR'],
      },
    },
  ],
  sdmxProxyToolName: 'sdmx_proxy',
  pythonCode: [
    '# Uses the sdmx1 library: https://pypi.org/project/sdmx1/',
    '# pip install sdmx1',
    '',
    'import sdmx',
    '',
    'provider = sdmx.Client("IMF_STA")',
    'data_msg = provider.data(',
    '    "IMF.STA,QGDP,1.0",',
    '    key="DEU.B1GQ",',
    "    params={'startPeriod': '2010', 'endPeriod': '2024'}",
    ')',
  ].join('\n'),
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
