import type { WidgetMeta } from '../../bridge/types';
import { getPersistedWidgetMeta, persistWidgetMeta } from '../widgetState';

function setOpenAi(openai: unknown): void {
  (window as unknown as { openai?: unknown }).openai = openai;
}

const meta: WidgetMeta = {
  queries: [
    {
      urn: 'IMF.RES:WEO(9.0.0)',
      filters: [],
      metadata: { countryDimension: '', indicatorDimensions: [] },
    },
  ],
  sdmxProxyToolName: 'sdmx_proxy',
};

describe('persistWidgetMeta', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('calls window.openai.setWidgetState with the given meta', () => {
    const setWidgetState = vi.fn();
    setOpenAi({ setWidgetState });

    persistWidgetMeta(meta);

    expect(setWidgetState).toHaveBeenCalledWith(meta);
  });

  it('does not throw when window.openai is undefined', () => {
    delete (window as unknown as { openai?: unknown }).openai;
    expect(() => persistWidgetMeta(meta)).not.toThrow();
  });

  it('does not throw when window.openai.setWidgetState is undefined', () => {
    setOpenAi({});
    expect(() => persistWidgetMeta(meta)).not.toThrow();
  });
});

describe('getPersistedWidgetMeta', () => {
  afterEach(() => {
    delete (window as unknown as { openai?: unknown }).openai;
  });

  it('returns the persisted meta when window.openai.widgetState is well-formed', () => {
    setOpenAi({ widgetState: meta });
    expect(getPersistedWidgetMeta()).toEqual(meta);
  });

  it('returns null when window.openai is undefined', () => {
    delete (window as unknown as { openai?: unknown }).openai;
    expect(getPersistedWidgetMeta()).toBeNull();
  });

  it('returns null when widgetState is undefined', () => {
    setOpenAi({});
    expect(getPersistedWidgetMeta()).toBeNull();
  });

  it('returns null when widgetState is missing queries', () => {
    setOpenAi({ widgetState: { sdmxProxyToolName: 'sdmx_proxy' } });
    expect(getPersistedWidgetMeta()).toBeNull();
  });

  it('returns null when widgetState is missing sdmxProxyToolName', () => {
    setOpenAi({ widgetState: { queries: [] } });
    expect(getPersistedWidgetMeta()).toBeNull();
  });

  it('returns null when widgetState is not an object', () => {
    setOpenAi({ widgetState: 'not-an-object' });
    expect(getPersistedWidgetMeta()).toBeNull();
  });

  it('returns null instead of throwing when reading widgetState throws', () => {
    setOpenAi({
      get widgetState(): never {
        throw new Error('host accessor not ready');
      },
    });
    expect(() => getPersistedWidgetMeta()).not.toThrow();
    expect(getPersistedWidgetMeta()).toBeNull();
  });
});
