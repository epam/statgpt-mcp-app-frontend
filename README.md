# StatGPT MCP App Frontend

A **single-widget MCP App** that renders an SDMX data explorer inside an AI chat host (Claude, ChatGPT, MCPJam). The host mounts this widget in a sandboxed iframe when the model calls `query_data`; the widget fetches SDMX data via the `sdmx_proxy` tool and renders it as an ag-grid table and an echarts chart.

- Speaks the spec **`io.modelcontextprotocol/ui 2026-01-26`** protocol directly with the host via `@modelcontextprotocol/ext-apps`.
- Consumes the published **`@epam/statgpt-*`** libraries as external npm dependencies (design system + SDMX toolkit).
- Exposes `GET /_mcp-app/index.html` so the backend MCP server can serve the widget HTML as a `ui://` resource.

## Stack

- Vite + React 19 SPA, served on a fixed port (`4300`) so its origin is stable.
- `@epam/statgpt-ui-components` (design system, Tailwind 3.4 + design tokens), `@epam/statgpt-sdmx-toolkit` (SDMX-JSON 2.0 parsing + period sorting), `@epam/statgpt-conversation-view` (shared attachment types), `ag-grid-community`, `echarts`.

## How it works

The host calls `query_data` → the widget receives the tool result via the MCP-UI spec bridge → `useSdmxData` fetches SDMX data via `sdmx_proxy` → adapters transform the response into a `ChartModel` → `DataView` renders a tabbed ag-grid table and echarts chart. Display mode and host theme are applied reactively via `useHostLayout` and `useHostTheme`.

## Run locally

### Scenario 1 — mock data (no MCP server needed)

```bash
npm install
npm run start    # http://localhost:4300
```

The widget runs with mock SDMX data and a mock host context. Use this for UI iteration — no MCP server or host chat required.

### Scenario 2 — connected to a local MCP server

```bash
npm run build:local    # build with absolute asset URLs → http://localhost:4300
npm run preview        # serve dist/ at http://localhost:4300
```

The widget is now available at `/_mcp-app/index.html`. A local MCP server can read this endpoint via `resources/read` and expose the HTML as a `ui://` resource. The host (Claude, ChatGPT, MCPJam) loads the widget in a sandboxed iframe when the model calls `query_data`.

`build:local` is required here (not `start`) because asset URLs must be absolute — root-relative paths would resolve against the host's sandbox origin and 404.

The MCP server setup is on the developer's side and is not provided in this repository.

## Testing

```bash
npm test              # run all tests once
npm run test:watch    # watch mode
```

Unit tests live next to their source files under `src/` with a `.spec.ts` suffix (Vitest + jsdom).

## Build

```bash
npm run build          # tsc --noEmit + vite build → dist/
npm run build:local    # same but with VITE_BASE_URL=http://localhost:4300 (for MCPJam testing)
npm run preview        # serve dist/ on :4300
```

## Docker

The widget is packaged as a static nginx container. Asset URLs are stamped into `index.html` at build time via `VITE_BASE_URL` — this must match the public origin where the container will be served, so the host can load widget assets cross-origin.

```bash
# Build (defaults to http://localhost:8080)
make docker-build

# Build for a specific origin
make docker-build VITE_BASE_URL=https://widget.example.com

# Run on port 8080
make docker-run

# Stop
make docker-stop
```

The container serves on port 80 (mapped to `PORT`, default `8080`). The `/_mcp-app/index.html` endpoint is handled by nginx and returns the same `index.html` as `/`. All assets are served with `Access-Control-Allow-Origin: *`, which is required for MCP hosts to load the widget cross-origin via `resourceDomains`.

When testing locally with MCPJam, pass `--widget-origin http://localhost:8080` to the MCP server's `local_server.py` so it fetches the widget HTML from the container instead of the dev server.

## Internal HTML endpoint

The widget exposes `GET /_mcp-app/index.html` (rewritten from `/` by the `mcpAppEndpoint()` Vite plugin). This is the path the backend MCP server fetches to serve the widget as a `ui://` resource. Asset URLs in the returned HTML are absolute when `VITE_BASE_URL` is set at build time.
