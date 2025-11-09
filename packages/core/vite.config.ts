import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import banner from "vite-plugin-banner";
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
    dts({
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src/"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "tests/**/*.test.ts",
        "tests/**/*.spec.ts"
      ]
    }),
    banner(licenseText)
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "quojs",
      formats: ["cjs", "es", "umd"],
      fileName: (format) =>
        format === "cjs"
          ? "quojs.cjs.js"
          : format === "es"
          ? "quojs.esm.js"
          : "quojs.umd.js"
    },
    rollupOptions: {},
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true
  },
  resolve: {},
  optimizeDeps: { include: [] }
});
