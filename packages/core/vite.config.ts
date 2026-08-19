import { defineConfig } from "vite";
import banner from "vite-plugin-banner";
import dts from "vite-plugin-dts";
import pkg from "./package.json";

// Fixed rather than computed. Deriving it from the clock means the first build after New Year
// rewrites every dist file in the suite, so a release diff would carry churn nobody authored.
// Bumping it is a deliberate edit, like the version.
const year = 2026;
const licenseText = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${year} ${pkg.author.name}
 * License: ${pkg.license} */`;

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
    // es2022 rather than es2020 so class fields emit natively. Downlevelling them costs a
    // helper preamble plus one `__publicField(this, ...)` call per field — 55 of them across
    // `Store`, which every consumer pays for on every import. The floor this sets (Chrome 94,
    // Safari 15.4, Firefox 93, all shipped by early 2022) is already well below what the
    // package supports.
    target: "es2022",
    minify: true,
    emptyOutDir: true,
  },
  resolve: {},
  optimizeDeps: { include: [] },
});
