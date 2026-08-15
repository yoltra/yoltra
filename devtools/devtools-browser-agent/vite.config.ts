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
      // `.cjs` and `.mjs`, not `.cjs.js`/`.esm.js`. This package declares `"type": "module"`,
      // which makes every `.js` file ESM — so the `require` condition pointed at a file Node
      // parsed as ESM and `require("@yoltra/devtools-browser-agent")` threw `ReferenceError: exports is not
      // defined in ES module scope`. An explicit extension states the format outright.
      fileName: (format) => (format === "cjs" ? "devtools-browser-agent.cjs" : "devtools-browser-agent.mjs"),
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
