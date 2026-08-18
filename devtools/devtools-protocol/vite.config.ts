import { defineConfig } from "vite";
import banner from "vite-plugin-banner";
import dts from "vite-plugin-dts";

import pkg from "./package.json";

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
        "tests/**/*.spec.ts",
      ],
    }),
    banner(licenseText),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "yoltraDevtoolsProtocol",
      formats: ["cjs", "es"],
      // `.cjs` and `.mjs`, not `.cjs.js`/`.esm.js`. This package declares `"type": "module"`,
      // which makes every `.js` file ESM — so the `require` condition pointed at a file Node
      // parsed as ESM and `require("@yoltra/devtools-protocol")` threw `ReferenceError: exports is not
      // defined in ES module scope`. An explicit extension states the format outright.
      fileName: (format) => (format === "cjs" ? "devtools-protocol.cjs" : "devtools-protocol.mjs"),
    },
    outDir: "dist",
    sourcemap: true,
    // Aligned with `@yoltra/core`, which sets the suite's floor at es2022 (see the reasoning
    // in packages/core/vite.config.ts). A lower target here would advertise support the suite
    // cannot deliver anyway: anything depending on core already requires es2022.
    target: "es2022",
    minify: true,
    emptyOutDir: true,
  },
});
