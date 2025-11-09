import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dts from "vite-plugin-dts";
import banner from "vite-plugin-banner";
import tsconfigPaths from "vite-tsconfig-paths";

import pkg from "./package.json" assert { type: "json" };

const year = new Date().getFullYear();
const licenseText = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${year} ${pkg.author.name}
 * License: ${pkg.license}
 * Homepage: ${pkg.homepage || ""}
 */`;

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.build.json",
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src"],
      logLevel: "silent"
    }),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
      ignoreConfigErrors: true
    }),
    banner(licenseText)
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "quojs-react",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "cjs" ? "index.cjs" : "index.mjs")
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2019",
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "@quojs/core", "tslib"],
      output: {
        compact: true,
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          tslib: "tslib"
        }
      },
      treeshake: true
    }
  },
  resolve: {
    dedupe: ["tslib"]
  },
  optimizeDeps: {
    include: [],
    exclude: ["tslib", "@quojs/core"]
  }
});
