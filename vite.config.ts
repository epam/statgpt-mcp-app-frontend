import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Multi-asset SPA served from an origin — NOT a single-file inline build.
// The prototype's outer widget loads this app by URL into a cross-origin
// <iframe>, so a normal hashed-asset build is correct here. Fixed port so
// the origin we register in the prototype's STATGPT_INNER_FRAME_DOMAINS is
// stable across restarts.
export default defineConfig({
  plugins: [react()],
  server: { port: 4300, strictPort: true },
  preview: { port: 4300, strictPort: true },
  css: {
    preprocessorOptions: {
      scss: {
        // Lets `@use 'tailwindcss/base'` and
        // `@use '@epam/statgpt-ui-components/styles-tailwind.scss'` resolve
        // bare package specifiers from node_modules (dart-sass does not do
        // node resolution by default; webpack-based apps get this for free).
        loadPaths: ["node_modules"],
      },
    },
  },
  build: {
    target: "es2020",
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true,
  },
});
