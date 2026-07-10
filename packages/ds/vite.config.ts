import { resolve } from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig, type Plugin } from "vite";
import banner from "vite-plugin-banner";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

import pkg from "./package.json" assert { type: "json" };

const year = new Date().getFullYear();
const licenseText = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${year} ${pkg.author.name}
 * License: ${pkg.license}
 * Homepage: ${pkg.homepage || ""}
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree
 */`;

/**
 * Source modules that must run on the client (React state / browser APIs).
 * Any emitted chunk that includes one of these needs a `"use client"`
 * directive so RSC consumers treat it as a client module — Rollup strips
 * per-file directives when bundling, so we re-add it to the output.
 */
const CLIENT_MODULES = [
  "src/client.ts",
  "src/theme/ThemeProvider.tsx",
  "src/primitives/CodeBlock.tsx",
  "src/primitives/Tabs.tsx",
].map((p) => resolve(__dirname, p));

function clientDirectivePlugin(): Plugin {
  return {
    name: "yoltra-ds-use-client",
    renderChunk(code, chunk) {
      const touchesClient = chunk.moduleIds.some((id) => CLIENT_MODULES.includes(id));
      if (!touchesClient) return null;
      // Prepend as the very first statement (before the license banner, which
      // is a comment — directives may be preceded by comments).
      return { code: `'use client';\n${code}`, map: null };
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.build.json",
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src"],
      logLevel: "silent",
    }),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
      ignoreConfigErrors: true,
    }),
    banner(licenseText),
    clientDirectivePlugin(),
  ],
  build: {
    lib: {
      entry: {
        index: "src/index.ts",
        client: "src/client.ts",
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) => `${entryName}.${format === "cjs" ? "cjs" : "mjs"}`,
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2019",
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime", "tslib"],
      output: {
        compact: true,
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
      treeshake: true,
    },
  },
  resolve: {
    dedupe: ["react", "react-dom", "tslib"],
  },
});
