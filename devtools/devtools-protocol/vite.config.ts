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
      fileName: (format) =>
        format === "cjs" ? "devtools-protocol.cjs.js" : "devtools-protocol.esm.js",
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
});
