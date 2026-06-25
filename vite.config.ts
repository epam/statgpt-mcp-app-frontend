import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

// Exposes GET /_mcp-app/index.html — the stable internal endpoint the MCP
// server fetches on resources/read (CONTRACTS.md §5, FRONTEND.md §2).
// Returns the same HTML as root; the separate path is a stable contract
// that won't clash with app routing in the production Next.js build.
function mcpAppEndpoint(): Plugin {
  const rewrite = (
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void,
  ) => {
    if (req.url === '/_mcp-app/index.html') {
      req.url = '/';
      res.setHeader('Cache-Control', 'no-cache');
    }
    next();
  };
  return {
    name: 'mcp-app-endpoint',
    configureServer: (s) => () => s.middlewares.use(rewrite),
    configurePreviewServer: (s) => () => s.middlewares.use(rewrite),
    // In dev mode, Vite always injects root-relative paths (/@vite/client,
    // /src/main.tsx) regardless of the `base` config. Those resolve against
    // the sandbox iframe origin — not localhost:4300 — and 404.
    // This hook rewrites root-relative src/href to absolute when VITE_BASE_URL
    // is set. It is a no-op during production builds (base already stamps
    // absolute URLs, so no root-relative paths remain to rewrite).
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        const base = process.env.VITE_BASE_URL;
        if (!base) return html;
        return html.replace(/(src|href)="\//g, `$1="${base}/`);
      },
    },
  };
}

// base is stamped into every asset URL in the built index.html.
// Without an absolute base, asset paths are root-relative (/assets/...) and
// resolve against the host's sandbox iframe origin — not the widget origin —
// producing 404s. VITE_BASE_URL must equal the public widget origin.
// Dev default (http://localhost:4300) is set in the `start` npm script.
export default defineConfig({
  base: process.env.VITE_BASE_URL ?? '/',
  plugins: [react(), mcpAppEndpoint()],
  server: {
    port: 4300,
    strictPort: true,
    cors: true,
  },
  preview: { port: 4300, strictPort: true, cors: true },
  css: {
    preprocessorOptions: {
      scss: {
        // Lets `@use 'tailwindcss/base'` and
        // `@use '@epam/statgpt-ui-components/styles-tailwind.scss'` resolve
        // bare package specifiers from node_modules (dart-sass does not do
        // node resolution by default; webpack-based apps get this for free).
        loadPaths: ['node_modules'],
      },
    },
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
});
