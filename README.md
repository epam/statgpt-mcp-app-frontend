# StatGPT MCP App Frontend

An **inner-iframe MCP app** for the `statgpt-mcp-apps-prototype` (the inner widget renders an SDMX data explorer). The prototype's
outer chart widget can host a second, cross-origin `<iframe>` and act as its agent
bridge (see `statgpt-mcp-apps-prototype/docs/007-nested-iframe/`). This repo is a real
app that fills that slot:

- Speaks the inner side of the **`mcpapp/proxy/*` JSON-RPC-over-MessageChannel** protocol
  so it works inside the Claude.ai / ChatGPT / MCPJam MCP-Apps hosts.
- Consumes the published **`@epam/statgpt-*`** libraries as external npm dependencies
  (design system + SDMX toolkit).
- Renders the tool-result data as an interactive **echarts** chart + a data table.

## Stack

- Vite + React 19 SPA, served on a fixed port (`4300`) so its origin is stable.
- `@epam/statgpt-ui-components` (design system, Tailwind 3.4 + design tokens),
  `@epam/statgpt-sdmx-toolkit` (period sorting / SDMX parsing), `echarts` + `echarts-for-react`.

> React 19 is required by the `@epam/statgpt-*@0.6.x` peer deps. This is fine even
> though the prototype's outer widget is React 18 — they are separate cross-origin
> bundles that only exchange `postMessage`, so there is no shared React runtime.

## Layout

```
src/
  main.tsx              # starts the bridge, mounts <App/>
  App.tsx               # orchestration: ready → fetch_sdmx_data → chart + table
  proxy/
    types.ts            # mcpapp/proxy/* wire types
    innerBridge.ts      # the inner proxy client (bootstrap/init/ready/RPC/ingress)
    useBridge.ts        # useSyncExternalStore hook over the bridge
  sdmx/parse.ts         # extract chart metadata + normalize fetch result -> chart model
  chart/buildOption.ts  # echarts line-chart option
  components/
    Chart.tsx           # <ReactECharts>
    DataTable.tsx       # period × series table
  styles/
    global.scss         # tailwind layers + @epam ui-components styles
    colors.scss         # :root design tokens
```

## Run locally against the prototype

```powershell
# Terminal 1 — serve this app
npm install
npm run dev                      # http://localhost:4300

# Terminal 2 — run the prototype MCP server pointed at this app.
# local_server.py reads these with os.environ.setdefault, so values set
# in the shell BEFORE launch win over its built-in /inner-widget default.
$env:STATGPT_INNER_WIDGET_URL     = "http://localhost:4300"
$env:STATGPT_INNER_FRAME_DOMAINS  = "http://localhost:4300"
$env:STATGPT_INNER_TOOL_ALLOWLIST = "fetch_sdmx_data"
cd ..\statgpt-mcp-apps-prototype
pwsh scripts/local-run.ps1
```

Then open the printed MCP server URL in MCPJam / MCP Inspector, trigger
`get_chart_data("DEU")`, and open the outer widget's **Nested** tab. The explorer
loads, calls `fetch_sdmx_data`, and renders the series.

For a deployed (HTTPS) origin later, point the prototype's MCP Lambda at it with
`statgpt-mcp-apps-prototype/scripts/set-inner-widget.ps1`.

## Build

```powershell
npm run build        # tsc --noEmit + vite build -> dist/
npm run preview      # serve dist/ on :4300
```
