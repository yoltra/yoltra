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
      entry: "src/index.tsx",
      name: "yoltraDevtoolsStoreview",
      formats: ["cjs", "es"],
      fileName: (format) =>
        format === "cjs" ? "devtools-storeview.cjs.js" : "devtools-storeview.esm.js",
    },
    rollupOptions: {
      external: ["react", "react-dom", "@yoltra/devtools-protocol", "@yoltra/devtools-ui"],
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
});
