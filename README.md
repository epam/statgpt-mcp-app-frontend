# StatGPT MCP App Frontend

A **single-widget MCP App** that renders an SDMX data explorer inside an AI chat host (Claude, ChatGPT, MCPJam). The host mounts this widget in a sandboxed iframe when the model calls `query_data`; the widget fetches SDMX data via the `sdmx_proxy` tool and renders it in a `Grid` tab as an ag-grid table.

- Speaks the spec **`io.modelcontextprotocol/ui 2026-01-26`** protocol directly with the host via `@modelcontextprotocol/ext-apps`.
- Consumes the published **`@epam/statgpt-*`** libraries as external npm dependencies (design system + SDMX toolkit).
- Exposes `GET /_mcp-app/index.html` so the backend MCP server can serve the widget HTML as a `ui://` resource.

## Stack

- Vite + React 19 SPA, served on a fixed port (`4300`) so its origin is stable.
- `@epam/statgpt-ui-components` (design system, Tailwind 3.4 + design tokens), `@epam/statgpt-sdmx-toolkit` (SDMX-JSON 2.0 parsing + period sorting), `@epam/statgpt-conversation-view` (shared attachment types), `@epam/statgpt-shared-toolkit`, `ag-grid-community`, `echarts`.

## How it works

The host calls `query_data` → the widget receives the tool result via the MCP-UI spec bridge → `useSdmxData` fetches SDMX data via `sdmx_proxy` → adapters transform the response into a `ChartModel` → `DataView` renders the `Grid` tab as an ag-grid table. Display mode and host theme are applied reactively via `useHostLayout` and `useHostTheme`.

## Environment variables

Local builds bake `VITE_BASE_URL` into the static output via Vite's `base`. The **Docker image** builds with a placeholder origin and rewrites it to the **runtime** `VITE_BASE_URL` on startup (`docker-entrypoint.d/40-replace-base-url.sh`), so one image serves any environment. The widget HTML is served by the host inside a sandboxed iframe whose origin differs from the widget origin, so asset URLs must be absolute and point back at the widget origin.

| Variable | Scope | Default | Required | Purpose |
|---|---|---|---|---|
| `VITE_BASE_URL` | Build (local) / **runtime** (Docker) | `/` | Yes for any host-served deploy | Public origin where the widget assets are served. Stamped into the built assets so URLs are **absolute** (e.g. `https://widget.example.com/assets/...`). Without it, asset paths are root-relative (`/assets/...`) and resolve against the host's sandbox iframe origin — not the widget origin — producing 404s. Must equal the public widget origin; that origin must serve assets with permissive CORS (`Access-Control-Allow-Origin: *`) and be listed in the host's CSP `resourceDomains`. In the Docker image it is read at container start (`docker run -e VITE_BASE_URL=...`); pass it **without** a trailing slash. In dev mode it also drives the `transformIndexHtml` hook that rewrites Vite's root-relative dev URLs (`/@vite/client`, `/src/main.tsx`) to absolute. |
| `VITE_SOURCEMAP` | Build | sourcemaps **on** | No | Set to `false` to disable JS sourcemaps in the build. The Dockerfile sets this to `false`. |
| `PORT` | Makefile / Docker only | `8080` | No | Host port the nginx container is mapped to (the container itself listens on `80`). Also feeds the default `VITE_BASE_URL` in the Makefile (`http://localhost:$(PORT)`). |

> `IMAGE` and `TAG` in the `Makefile` are Docker image tagging knobs, not application configuration.

### Where each value comes from

- **`npm run start`** — no `VITE_BASE_URL`; `base` falls back to `/`. Fine for standalone UI iteration at `http://localhost:4300`.
- **`npm run build:local`** — hardcodes `VITE_BASE_URL=http://localhost:4300` for MCPJam testing.
- **Docker / production** — the image is built once with a placeholder origin; the real origin is supplied at run time: `make docker-run VITE_BASE_URL=https://widget.example.com` (or `docker run -e VITE_BASE_URL=...`). The startup script rewrites the placeholder in the built assets before nginx serves them.

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

The widget is packaged as a static nginx container. The widget origin is chosen **at run time**: the build stamps a placeholder origin into the assets, and a startup script (`docker-entrypoint.d/40-replace-base-url.sh`) rewrites it to the `VITE_BASE_URL` passed via `docker run -e`. **One image serves every environment.** `VITE_BASE_URL` must match the public origin where the container is served so the host can load widget assets cross-origin.

```bash
# Build the image (origin not needed yet)
make docker-build

# Run, supplying the origin (defaults to http://localhost:8080)
make docker-run

# Run for a specific origin
make docker-run VITE_BASE_URL=https://widget.example.com

# Stop
make docker-stop
```

The container serves on port 80 (mapped to `PORT`, default `8080`). `VITE_BASE_URL` is **required at run time** — the startup script aborts if it is unset (the widget would 404 in the host iframe). The `/_mcp-app/index.html` endpoint is handled by nginx and returns the same `index.html` as `/`. All assets are served with `Access-Control-Allow-Origin: *`, which is required for MCP hosts to load the widget cross-origin via `resourceDomains`.

> If the container runs with a read-only root filesystem, `/usr/share/nginx/html` must remain writable (or be mounted from a writable volume) so the startup rewrite can run.

When testing locally with MCPJam, pass `--widget-origin http://localhost:8080` to the MCP server's `local_server.py` so it fetches the widget HTML from the container instead of the dev server.

## Internal HTML endpoint

The widget exposes `GET /_mcp-app/index.html` (rewritten from `/` by the `mcpAppEndpoint()` Vite plugin). This is the path the backend MCP server fetches to serve the widget as a `ui://` resource. Asset URLs in the returned HTML are absolute, pointing at the origin given by `VITE_BASE_URL` (stamped at build time for local builds, rewritten at container start for the Docker image).
