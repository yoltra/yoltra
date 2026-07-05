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
      name: "yoltraDevtoolsNodeAgent",
      formats: ["cjs", "es"],
      fileName: (format) =>
        format === "cjs" ? "devtools-node-agent.cjs.js" : "devtools-node-agent.esm.js",
    },
    rollupOptions: {
      external: ["ws", "@yoltra/devtools-protocol", "@yoltra/core"],
    },
    outDir: "dist",
    sourcemap: true,
    target: "es2020",
    minify: true,
    emptyOutDir: true,
  },
});
