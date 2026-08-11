import type { WidgetMeta } from '../bridge/types';

interface OpenAiWidgetApi {
  widgetState?: unknown;
  setWidgetState?: (state: unknown) => void;
}

function getOpenAi(): OpenAiWidgetApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { openai?: OpenAiWidgetApi }).openai;
}

/**
 * Persists the current widget metadata via ChatGPT's `window.openai.setWidgetState`,
 * so it can be recovered if a later reload replays a `tool-result` notification that
 * no longer carries the full payload. No-op on hosts that don't expose this API.
 * @param meta - The widget metadata extracted from the latest full tool result.
 */
export function persistWidgetMeta(meta: WidgetMeta): void {
  getOpenAi()?.setWidgetState?.(meta);
}

/**
 * Reads back widget metadata previously saved with {@link persistWidgetMeta}.
 * Called during render, so a throwing host accessor is caught rather than
 * left to propagate — there is no error boundary around this app.
 * @returns The persisted `WidgetMeta`, or null if unavailable or malformed.
 */
export function getPersistedWidgetMeta(): WidgetMeta | null {
  let state: unknown;
  try {
    state = getOpenAi()?.widgetState;
  } catch {
    return null;
  }
  if (!state || typeof state !== 'object') return null;
  const t = state as Partial<WidgetMeta>;
  if (!Array.isArray(t.queries) || !t.sdmxProxyToolName) return null;
  return t as WidgetMeta;
}
