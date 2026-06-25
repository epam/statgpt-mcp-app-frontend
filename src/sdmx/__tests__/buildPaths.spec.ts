import { dataPath } from '../buildPaths';

const q = {
  agency_id: 'IMF',
  resource_id: 'BOP',
  version: '1.0',
  key: 'A.US',
  context: 'dataflow',
};

describe('dataPath', () => {
  it('produces the correct path structure <base>/<agency>/<resource>/<version>/<key>?...', () => {
    const result = dataPath(q);
    expect(result).toContain('/sdmx/3.0/data/dataflow/IMF/BOP/1.0/A.US?');
  });

  it('includes the attributes query param', () => {
    const result = dataPath(q);
    expect(result).toContain('attributes=all');
  });

  it('merges extra params into the query string when provided', () => {
    const result = dataPath({
      ...q,
      params: { startPeriod: '2020', endPeriod: '2023' },
    });
    expect(result).toContain('startPeriod=2020');
    expect(result).toContain('endPeriod=2023');
    expect(result).toContain('attributes=all');
  });

  it('works when params is omitted', () => {
    const { params: _omitted, ...qWithoutParams } = { ...q, params: undefined };
    const result = dataPath(qWithoutParams);
    expect(result).toContain('/sdmx/3.0/data/dataflow/IMF/BOP/1.0/A.US?');
    expect(result).toContain('attributes=all');
  });
});
