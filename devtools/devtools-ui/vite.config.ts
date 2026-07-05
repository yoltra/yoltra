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
      name: "yoltraDevtoolsUi",
      formats: ["cjs", "es"],
      fileName: (format) => (format === "cjs" ? "devtools-ui.cjs.js" : "devtools-ui.esm.js"),
    },
    rollupOptions: {
      external: ["react", "@yoltra/devtools-protocol"],
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
});
