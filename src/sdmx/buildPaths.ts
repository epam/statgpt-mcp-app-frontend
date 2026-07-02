import type { SdmxQuery } from '../bridge/types';
import {
  SDMX_BASE_PATH,
  SDMX_DEFAULT_ATTRIBUTES,
  SDMX_STRUCTURE_BASE_PATH,
  SDMX_STRUCTURE_DETAIL,
  SDMX_STRUCTURE_REFERENCES,
} from '../constants/sdmx';

/**
 * Builds the SDMX REST API path used as the `path` argument when calling the MCP tool proxy.
 *
 * @param q - SDMX query parameters containing agency ID, resource ID, version, key, and optional extra query params.
 * @returns A URL path string of the form `<base>/<agency>/<resource>/<version>/<key>?attributes=...&...`.
 */
export function dataPath(q: SdmxQuery['sdmx']): string {
  const base = `${SDMX_BASE_PATH}/${q.agency_id}/${q.resource_id}/${q.version}/${q.key}`;
  const params = new URLSearchParams({
    attributes: SDMX_DEFAULT_ATTRIBUTES,
    ...(q.params ?? {}),
  });
  return `${base}?${params}`;
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
 * @param q - SDMX query parameters containing agency ID, resource ID, and version.
 * @returns A URL path string of the form `<base>/<agency>/<resource>/<version>?references=descendants&detail=referencepartial`.
 */
export function structurePath(q: SdmxQuery['sdmx']): string {
  const base = `${SDMX_STRUCTURE_BASE_PATH}/${q.agency_id}/${q.resource_id}/${q.version}`;
  const params = new URLSearchParams({
    references: SDMX_STRUCTURE_REFERENCES,
    detail: SDMX_STRUCTURE_DETAIL,
  });
  return `${base}?${params}`;
}
