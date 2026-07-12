import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Resolve a path relative to this config file. Repo root is three levels up.
const fromHere = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Consume Yoltra + the devtools suite straight from each package's built dist —
// no npm install. Aliasing every @yoltra/* specifier to a single dist entry
// pins ONE instance of each package across the app, the React bindings, the
// devtools agent, the loopback hub, and the panel — so the shared DevtoolsRole
// enum and the store.instrument() wiring line up. Rebuild a package after
// editing it:  rush build --only @yoltra/devtools-ui  (etc.)
const yoltraDistAliases = {
  "@yoltra/core": fromHere("../../../packages/core/dist/yoltra.esm.js"),
  "@yoltra/react": fromHere("../../../packages/react/dist/index.mjs"),
  // Design system: the `/client` subpath must be aliased before the bare
  // specifier so the more specific match wins.
  "@yoltra/ds/client": fromHere("../../../packages/ds/dist/client.mjs"),
  "@yoltra/ds": fromHere("../../../packages/ds/dist/index.mjs"),
  "@yoltra/devtools-protocol": fromHere(
    "../../../devtools/devtools-protocol/dist/devtools-protocol.esm.js",
  ),
  "@yoltra/devtools-browser-agent": fromHere(
    "../../../devtools/devtools-browser-agent/dist/devtools-browser-agent.esm.js",
  ),
  "@yoltra/devtools-ui": fromHere("../../../devtools/devtools-ui/dist/devtools-ui.esm.js"),
  "@yoltra/devtools-storeview": fromHere(
    "../../../devtools/devtools-storeview/dist/devtools-storeview.esm.js",
  ),
};

export default defineConfig({
  plugins: [react()],
  resolve: { alias: yoltraDistAliases },
  // The dist bundles gate dev-only behaviour on process.env.NODE_ENV.
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
  // The embedded panel bundles the full devtools UI (charts included); a large
  // single chunk is expected for a demo, so raise Vite's advisory threshold.
  build: { chunkSizeWarningLimit: 3000 },
  server: {
    // Allow serving the built dist that lives outside this example folder.
    fs: { allow: [fromHere("../../../")] },
  },
});
