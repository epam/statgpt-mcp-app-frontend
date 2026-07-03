import type { DataQuery } from '@epam/statgpt-shared-toolkit';
import {
  DimensionType,
  getTimeQueryFilter,
  getTimeSeriesFilterKey,
  splitUrn,
  type Dimension,
} from '@epam/statgpt-sdmx-toolkit';
import {
  SDMX_BASE_PATH,
  SDMX_DEFAULT_ATTRIBUTES,
  SDMX_STRUCTURE_BASE_PATH,
  SDMX_STRUCTURE_DETAIL,
  SDMX_STRUCTURE_REFERENCES,
} from '../constants/sdmx';

/**
 * `getTimeSeriesFilterKey`/`getTimeQueryFilter` only read `id`/`type` off each
 * dimension, so these stubs stand in for the real DSD dimensions without
 * requiring the structure fetch to resolve first, keeping data and structure
 * requests concurrent.
 */
function keyDimensionStubs(ids: string[] | undefined): Dimension[] {
  return (ids ?? []).map((id) => ({
    id,
    type: DimensionType.DIMENSION,
    conceptIdentity: '',
  }));
}

function timeDimensionStub(id: string | undefined): Dimension | undefined {
  return id
    ? { id, type: DimensionType.TIME_DIMENSION, conceptIdentity: '' }
    : undefined;
}

/**
 * Builds the SDMX REST API path used as the `path` argument when calling the MCP tool proxy.
 *
 * @param q - The query's dataset URN, filters, and dimension-role metadata.
 * @returns A URL path string of the form `<base>/<agency>/<resource>/<version>/<key>?attributes=...&...`.
 */
export function dataPath(q: DataQuery): string {
  const { agency, id, version } = splitUrn(q.urn);
  const key = getTimeSeriesFilterKey(
    keyDimensionStubs(q.metadata.keyDimensionIdsInDsdOrder),
    q.filters ?? [],
  );
  const timeDimension = timeDimensionStub(q.metadata.timePeriodDimension);
  const timeFilter = timeDimension
    ? getTimeQueryFilter(q, timeDimension)
    : null;

  const base = `${SDMX_BASE_PATH}/${agency}/${id}/${version}/${key || '*'}`;
  const params = new URLSearchParams({
    attributes: SDMX_DEFAULT_ATTRIBUTES,
  });
  const query = [timeFilter, params.toString()].filter(Boolean).join('&');
  return `${base}?${query}`;
}

/**
 * Builds the SDMX REST API path for fetching dataflow structure metadata
 * (`StructuralData`) — codelists, concept schemes, data structures, etc.
 *
 * Uses the same `references`/`detail` combination as the portal
 * (`references=descendants&detail=referencepartial`): full codelists for
 * value labelling, without the concept-scheme/description bloat that
 * `references=all` includes.
 *
 * @param q - The query's dataset URN.
 * @returns A URL path string of the form `<base>/<agency>/<resource>/<version>?references=descendants&detail=referencepartial`.
 */
export function structurePath(q: DataQuery): string {
  const { agency, id, version } = splitUrn(q.urn);
  const base = `${SDMX_STRUCTURE_BASE_PATH}/${agency}/${id}/${version}`;
  const params = new URLSearchParams({
    references: SDMX_STRUCTURE_REFERENCES,
    detail: SDMX_STRUCTURE_DETAIL,
  });
  return `${base}?${params}`;
}
