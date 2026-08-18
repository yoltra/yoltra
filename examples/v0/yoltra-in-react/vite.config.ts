import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Resolve a path relative to this config file (repo root is three levels up).
const fromHere = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Consume Yoltra straight from each package's built dist — no npm install. See
// the kinetic-logo example's vite.config for the full rationale. Aliasing every
// @yoltra/* specifier to a single dist entry pins one @yoltra/core instance
// across the app, the React bindings, and the devtools agent. Refresh after
// editing a package:  rush build --only @yoltra/react   (or @yoltra/core, etc.)
const yoltraDistAliases = {
  "@yoltra/core": fromHere("../../../packages/core/dist/yoltra.mjs"),
  "@yoltra/react": fromHere("../../../packages/react/dist/index.mjs"),
  // Design system: the `/client` subpath must be aliased before the bare
  // specifier so the more specific match wins.
  "@yoltra/ds/client": fromHere("../../../packages/ds/dist/client.mjs"),
  "@yoltra/ds": fromHere("../../../packages/ds/dist/index.mjs"),
  "@yoltra/devtools-browser-agent": fromHere(
    "../../../devtools/devtools-browser-agent/dist/devtools-browser-agent.mjs",
  ),
  "@yoltra/devtools-protocol": fromHere(
    "../../../devtools/devtools-protocol/dist/devtools-protocol.mjs",
  ),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: yoltraDistAliases },
  // This demo bundles several state libraries side by side for comparison, so a
  // large single chunk is expected. Raise Vite's advisory threshold — Rush treats
  // build warnings as failures and this size advisory is not actionable.
  build: { chunkSizeWarningLimit: 2000 },
  // The dist bundles reference process.env.NODE_ENV for dev-only gating.
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
  server: { fs: { allow: [fromHere("../../../")] } },
  test: {
    // The parity suite drives both state twins with no DOM and no devtools: it builds its
    // own stores from the same reducer specs and slices the app composes.
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
