import { QueryFilterType } from '@epam/statgpt-shared-toolkit';
import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import { dataPath, structurePath } from '../buildPaths';

const q: DataQuery = {
  urn: 'IMF:BOP(1.0)',
  filters: [
    { componentCode: 'COUNTRY', operator: QueryFilterType.IN, values: ['US'] },
  ],
  metadata: {
    countryDimension: 'COUNTRY',
    indicatorDimensions: [],
    keyDimensionIdsInDsdOrder: ['COUNTRY'],
  },
};

describe('dataPath', () => {
  it('produces the correct path structure <base>/<agency>/<resource>/<version>/<key>?...', () => {
    const result = dataPath(q);
    expect(result).toContain('/sdmx/3.0/data/dataflow/IMF/BOP/1.0/US?');
  });

  it('includes the attributes query param', () => {
    const result = dataPath(q);
    expect(result).toContain('attributes=all');
  });

  it('wildcards key dimensions with no matching filter', () => {
    const result = dataPath({
      ...q,
      metadata: {
        ...q.metadata,
        keyDimensionIdsInDsdOrder: ['COUNTRY', 'INDICATOR'],
      },
    });
    expect(result).toContain('/sdmx/3.0/data/dataflow/IMF/BOP/1.0/US.*?');
  });

  it('joins multiple filter values with +', () => {
    const result = dataPath({
      ...q,
      filters: [
        {
          componentCode: 'COUNTRY',
          operator: QueryFilterType.IN,
          values: ['US', 'DE'],
        },
      ],
    });
    expect(result).toContain('/sdmx/3.0/data/dataflow/IMF/BOP/1.0/US+DE?');
  });

  it('builds a structured time-period query fragment from a BETWEEN filter', () => {
    const result = dataPath({
      ...q,
      filters: [
        ...q.filters!,
        {
          componentCode: 'TIME_PERIOD',
          operator: QueryFilterType.BETWEEN,
          values: ['2020-01-01', '2023-12-31'],
        },
      ],
      metadata: { ...q.metadata, timePeriodDimension: 'TIME_PERIOD' },
    });
    expect(result).toContain(
      'c%5BTIME_PERIOD%5D=ge%3A2020-01-01%2Ble%3A2023-12-31',
    );
  });

  it('falls back to a bare wildcard when no key dimensions are configured', () => {
    const result = dataPath({
      ...q,
      filters: [],
      metadata: { ...q.metadata, keyDimensionIdsInDsdOrder: [] },
    });
    expect(result).toContain('/sdmx/3.0/data/dataflow/IMF/BOP/1.0/*?');
  });
});

describe('structurePath', () => {
  it('produces the correct path structure <base>/<agency>/<resource>/<version>?...', () => {
    const result = structurePath(q);
    expect(result).toContain('/sdmx/3.0/structure/dataflow/IMF/BOP/1.0?');
  });

  it('includes references=descendants', () => {
    const result = structurePath(q);
    expect(result).toContain('references=descendants');
  });

  it('includes detail=referencepartial', () => {
    const result = structurePath(q);
    expect(result).toContain('detail=referencepartial');
  });

  it('does not include the data key in the path', () => {
    const result = structurePath(q);
    expect(result).not.toContain('/US');
  });

  it('does not include an attributes param', () => {
    const result = structurePath(q);
    expect(result).not.toContain('attributes=');
  });
});
