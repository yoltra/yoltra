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
      // `.cjs` and `.mjs`, not `.cjs.js`/`.esm.js`. This package declares `"type": "module"`,
      // which makes every `.js` file ESM — so the `require` condition pointed at a file Node
      // parsed as ESM and `require("@yoltra/devtools-node-agent")` threw `ReferenceError: exports is not
      // defined in ES module scope`. An explicit extension states the format outright.
      fileName: (format) => (format === "cjs" ? "devtools-node-agent.cjs" : "devtools-node-agent.mjs"),
    },
    rollupOptions: {
      external: ["ws", "@yoltra/devtools-protocol", "@yoltra/core"],
    },
    outDir: "dist",
    sourcemap: true,
    // Aligned with `@yoltra/core` on es2022 (see packages/core/vite.config.ts). This package
    // runs server-side only, where es2022 is supported throughout the supported range.
    target: "es2022",
    minify: true,
    emptyOutDir: true,
  },
});
