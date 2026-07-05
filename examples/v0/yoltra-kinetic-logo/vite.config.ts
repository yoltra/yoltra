import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Resolve a path relative to this config file. The repo root is three levels up
// (examples/v0/yoltra-kinetic-logo -> repo root).
const fromHere = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// ---------------------------------------------------------------------------
// Consume Yoltra straight from each package's built `dist/` — no npm install,
// no publish. The Rush workspace already symlinks @yoltra/* into node_modules,
// but Vite would pre-bundle them and keep serving a stale copy after a rebuild.
// Aliasing each specifier to its single dist entry instead:
//   * pins ONE instance of @yoltra/core across the app, the React bindings, and
//     the devtools agent, so store.instrument() wiring stays intact;
//   * serves the raw dist, so a rebuild shows up on the next page reload.
//
// Refresh a package after editing it:
//   rush build --only @yoltra/react        (or @yoltra/core, etc.)
//
// To iterate WITHOUT rebuilding, point these at each package's `src/index.ts`
// instead of dist — Vite compiles the TypeScript on the fly.
// ---------------------------------------------------------------------------
const yoltraDistAliases = {
  "@yoltra/core": fromHere("../../../packages/core/dist/yoltra.esm.js"),
  "@yoltra/react": fromHere("../../../packages/react/dist/index.mjs"),
  "@yoltra/devtools-browser-agent": fromHere(
    "../../../devtools/devtools-browser-agent/dist/devtools-browser-agent.esm.js",
  ),
  "@yoltra/devtools-protocol": fromHere(
    "../../../devtools/devtools-protocol/dist/devtools-protocol.esm.js",
  ),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: yoltraDistAliases },
  // The dist bundles reference process.env.NODE_ENV for dev-only gating (e.g.
  // freeze-in-dev). Define it so the raw ESM runs in the browser.
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
  server: {
    // Allow serving the built dist that lives outside this example folder.
    fs: { allow: [fromHere("../../../")] },
  },
});
