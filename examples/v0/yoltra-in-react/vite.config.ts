import react from "@vitejs/plugin-react-swc";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Resolve a path relative to this config file (repo root is three levels up).
const fromHere = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Consume Yoltra straight from each package's built dist — no npm install. See
// the kinetic-logo example's vite.config for the full rationale. Aliasing every
// @yoltra/* specifier to a single dist entry pins one @yoltra/core instance
// across the app, the React bindings, and the devtools agent. Refresh after
// editing a package:  rush build --only @yoltra/react   (or @yoltra/core, etc.)
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

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: { alias: yoltraDistAliases },
  // The dist bundles reference process.env.NODE_ENV for dev-only gating.
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
  server: { fs: { allow: [fromHere("../../../")] } },
});
