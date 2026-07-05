import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
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
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "yoltra-react",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "cjs" ? "index.cjs" : "index.mjs"),
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2019",
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "@yoltra/core", "tslib"],
      output: {
        compact: true,
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          tslib: "tslib",
        },
      },
      treeshake: true,
    },
  },
  resolve: {
    dedupe: ["tslib"],
  },
  optimizeDeps: {
    include: [],
    exclude: ["tslib", "@yoltra/core"],
  },
});
