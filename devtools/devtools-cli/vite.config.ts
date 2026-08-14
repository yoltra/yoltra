import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src/"],
    }),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      // `.mjs` rather than `.esm.js`. ESM-only under `"type": "module"`, so this one was never
      // broken — it is renamed so every package in the repo states its format the same way, and
      // so nothing here reads as the pattern that broke the dual-format packages.
      fileName: () => "devtools-cli.mjs",
    },
    rollupOptions: {
      external: [
        "react",
        "ink",
        "ws",
        "@yoltra/devtools-protocol",
        "@yoltra/devtools-server",
        "@yoltra/devtools-ui",
        "ink-text-input",
      ],
    },
    outDir: "dist",
    sourcemap: true,
    target: "node18",
    minify: false,
    emptyOutDir: true,
  },
});
