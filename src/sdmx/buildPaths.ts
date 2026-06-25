import type { SdmxQuery } from '../bridge/types';
import { SDMX_BASE_PATH, SDMX_DEFAULT_ATTRIBUTES } from '../constants/sdmx';

export function dataPath(q: SdmxQuery['sdmx']): string {
  const base = `${SDMX_BASE_PATH}/${q.agency_id}/${q.resource_id}/${q.version}/${q.key}`;
  const params = new URLSearchParams({
    attributes: SDMX_DEFAULT_ATTRIBUTES,
    ...(q.params ?? {}),
  });
  return `${base}?${params}`;
}
