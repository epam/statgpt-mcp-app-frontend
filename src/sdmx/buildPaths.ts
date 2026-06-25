import type { SdmxQuery } from '../bridge/types';
import { SDMX_BASE_PATH, SDMX_DEFAULT_ATTRIBUTES } from '../constants/sdmx';

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
