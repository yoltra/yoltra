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
      name: "yoltraDevtoolsBrowserAgent",
      formats: ["cjs", "es"],
      fileName: (format) =>
        format === "cjs" ? "devtools-browser-agent.cjs.js" : "devtools-browser-agent.esm.js",
    },
    rollupOptions: {
      external: ["@yoltra/devtools-protocol", "@yoltra/core"],
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
});
