import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src/"],
      exclude: ["src/**/*.test.ts"],
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "yoltraDevtoolsProtocol",
      formats: ["cjs", "es"],
      fileName: (format) =>
        format === "cjs"
          ? "devtools-protocol.cjs.js"
          : "devtools-protocol.esm.js",
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
});
