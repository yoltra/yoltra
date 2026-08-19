import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import banner from "vite-plugin-banner";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

import pkg from "./package.json";

// Fixed rather than computed. Deriving it from the clock means the first build after New Year
// rewrites every dist file in the suite, so a release diff would carry churn nobody authored.
// Bumping it is a deliberate edit, like the version.
const year = 2026;
const licenseText = `/*!
 * ${pkg.name} v${pkg.version}
 * (c) ${year} ${pkg.author.name}
 * License: ${pkg.license} */`;

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.build.json",
      insertTypesEntry: true,
      outDir: "dist/types",
      include: ["src"],
      logLevel: "silent",
    }),
    tsconfigPaths({
      projects: ["./tsconfig.json"],
      ignoreConfigErrors: true,
    }),
    banner(licenseText),
  ],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "yoltra-react",
      formats: ["es", "cjs"],
      fileName: (format) => (format === "cjs" ? "index.cjs" : "index.mjs"),
    },
    outDir: "dist",
    sourcemap: true,
    // Aligned with `@yoltra/core`, which sets the suite's floor at es2022 (see the reasoning
    // in packages/core/vite.config.ts). A lower target here would advertise support the suite
    // cannot deliver anyway: anything depending on core already requires es2022.
    target: "es2022",
    minify: true,
    emptyOutDir: true,
    rollupOptions: {
      external: ["react", "react-dom", "@yoltra/core", "tslib"],
      output: {
        compact: true,
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          tslib: "tslib",
        },
      },
      treeshake: true,
    },
  },
  resolve: {
    dedupe: ["tslib"],
  },
  optimizeDeps: {
    include: [],
    exclude: ["tslib", "@yoltra/core"],
  },
});
