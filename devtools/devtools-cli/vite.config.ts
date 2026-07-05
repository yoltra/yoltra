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
      fileName: () => "devtools-cli.esm.js",
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
