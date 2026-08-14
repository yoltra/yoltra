import { defineConfig } from "vite";
import banner from "vite-plugin-banner";
import dts from "vite-plugin-dts";
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
    dts({
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src/"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "tests/**/*.test.ts",
        "tests/**/*.spec.ts",
      ],
    }),
    banner(licenseText),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "yoltra",
      formats: ["cjs", "es", "umd"],
      // `.cjs` and `.mjs`, not `.cjs.js`/`.esm.js`. Node decides a `.js` file's format from the
      // nearest package.json `type` field, and this package has none — so `yoltra.esm.js` was
      // read as CommonJS and `import "@yoltra/core"` threw on any Node that does not guess
      // (everything before 22.7, which `engines: ">=18.18"` promises to support). An explicit
      // extension takes the guess away in both directions.
      //
      // The UMD build keeps its name: `unpkg` and `jsdelivr` point at it, and moving a CDN
      // path costs consumers something the rename buys them nothing for.
      fileName: (format) =>
        format === "cjs" ? "yoltra.cjs" : format === "es" ? "yoltra.mjs" : "yoltra.umd.js",
    },
    rollupOptions: {},
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
  resolve: {},
  optimizeDeps: { include: [] },
});
