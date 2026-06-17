# StatGPT MCP App Frontend

A **single-widget MCP App** that renders an SDMX data explorer inside an AI chat host (Claude, ChatGPT, MCPJam). The host mounts this widget in a sandboxed iframe when the model calls `query_data`; the widget fetches SDMX data via the `sdmx_proxy` tool and renders it as an ag-grid table and an echarts chart.

- Speaks the spec **`io.modelcontextprotocol/ui 2026-01-26`** protocol directly with the host via `@modelcontextprotocol/ext-apps`.
- Consumes the published **`@epam/statgpt-*`** libraries as external npm dependencies (design system + SDMX toolkit).
- Exposes `GET /_mcp-app/index.html` so the backend MCP server can serve the widget HTML as a `ui://` resource.

## Stack

- Vite + React 19 SPA, served on a fixed port (`4300`) so its origin is stable.
- `@epam/statgpt-ui-components` (design system, Tailwind 3.4 + design tokens), `@epam/statgpt-sdmx-toolkit` (SDMX-JSON 2.0 parsing + period sorting), `ag-grid-community`, `echarts`.

## Layout

```
src/
  main.tsx              # starts the bridge, mounts <App/>
  App.tsx               # orchestration: tool-result → fetch SDMX → render grid/chart
  bridge/
    types.ts            # BridgeSnapshot, WidgetToolResult, SdmxQuery
    hostBridge.ts       # @modelcontextprotocol/ext-apps App init + RPC
    useBridge.ts        # useSyncExternalStore hook over the bridge
  sdmx/
    parse.ts            # extractWidgetMeta + normalizeSdmxDataResponse → ChartModel
    buildPaths.ts       # SDMX REST 3.0 path builders
  adapters/
    chartModelToGrid.ts          # ChartModel → ag-grid RowData
    chartModelToChartingData.ts  # ChartModel → echarts series
  components/
    ConnectionStatus.tsx  # connecting / error / torndown states
    DataView.tsx          # tabbed grid + chart view
    ExplorerHeader.tsx    # title + refresh button
    ErrorBanner.tsx       # error message display
    AppProviders.tsx      # Tailwind + @epam providers
  hooks/
    useSdmxData.ts        # drives SDMX fetch from bridge snapshot
  styles/
    global.scss           # tailwind layers + @epam ui-components styles
    colors.scss           # :root design tokens
    fonts.scss            # typography utilities
    chart-attachment.scss # chart attachment styles
  mocks/
    sdmxData.ts           # mock data for dev mode
```

## Run locally against the prototype

```bash
# Terminal 1 — serve this app
npm install
npm run start                    # http://localhost:4300

# Terminal 2 — run the prototype MCP server
cd ../statgpt-mcp-apps-prototype
python src/server.py             # or your local runner
```

Then open the printed MCP server URL in MCPJam, trigger `query_data`, and the widget loads and renders the SDMX data table.

## Build

```bash
npm run build          # tsc --noEmit + vite build → dist/
npm run build:local    # same but with VITE_BASE_URL=http://localhost:4300 (for MCPJam testing)
npm run preview        # serve dist/ on :4300
```

## Internal HTML endpoint

The widget exposes `GET /_mcp-app/index.html` (rewritten from `/` by the `mcpAppEndpoint()` Vite plugin). This is the path the backend MCP server fetches to serve the widget as a `ui://` resource. Asset URLs in the returned HTML are absolute when `VITE_BASE_URL` is set at build time.
