import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

// Resolve a path relative to this config file (repo root is three levels up).
const fromHere = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Consume Yoltra straight from each package's built dist — no npm install. See
// the kinetic-logo example's vite.config for the full rationale. Refresh after
// editing a package:  rush build --only @yoltra/react   (or @yoltra/core)
const yoltraDistAliases = {
  "@yoltra/core": fromHere("../../../packages/core/dist/yoltra.esm.js"),
  "@yoltra/react": fromHere("../../../packages/react/dist/index.mjs"),
  // Design system: the `/client` subpath must be aliased before the bare
  // specifier so the more specific match wins.
  "@yoltra/ds/client": fromHere("../../../packages/ds/dist/client.mjs"),
  "@yoltra/ds": fromHere("../../../packages/ds/dist/index.mjs"),
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: { alias: yoltraDistAliases },
  // The dist bundles reference process.env.NODE_ENV for dev-only gating.
  define: { "process.env.NODE_ENV": JSON.stringify("development") },
  server: { fs: { allow: [fromHere("../../../")] } },
});
