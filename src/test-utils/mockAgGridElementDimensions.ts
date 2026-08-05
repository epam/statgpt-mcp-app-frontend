/**
 * ag-grid measures its container via `offsetWidth`/`offsetHeight`/`clientWidth`/
 * `clientHeight` to decide which rows are in the visible viewport for row
 * virtualization. jsdom always reports these as `0`, which makes ag-grid
 * render zero rows. Call this in a `beforeAll` in any spec that mounts
 * `AgGridReact` (directly, or via `DataGrid`) to give it a non-zero layout
 * to measure.
 */
export function mockAgGridElementDimensions() {
  const widths: Record<string, number> = {
    offsetWidth: 800,
    offsetHeight: 400,
    clientWidth: 800,
    clientHeight: 400,
  };
  for (const [prop, value] of Object.entries(widths)) {
    Object.defineProperty(window.HTMLElement.prototype, prop, {
      configurable: true,
      value,
    });
  }
}
