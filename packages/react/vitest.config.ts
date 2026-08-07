import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],

    include: [
      "tests/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}"
    ],
    exclude: [
      "common",
      "dist",
      "node_modules",
      "tests/helpers/**",
      "global.d.ts",
      "vite.config.ts"
    ],

    coverage: {
      reporter: ["text", "html", "lcov"],
      // Scoped to the shipped sources, as in `packages/core`. Without it coverage measured
      // whatever a run happened to load and excluded the rest one path at a time — and a
      // `benchmarks` directory, which by design executes nothing under `vitest run`, counted
      // as 0% and dragged the aggregate under the gate.
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: [
        "dist",
        "src/index.ts",
        "src/types.ts",
        "**/*.d.ts",
        "**/*.config.ts"
      ],
      // Percentages, not fractions — see the note in `packages/core/vitest.config.ts`. As
      // fractions these enforced 0.95%, so the gate never failed anything.
      thresholds: { lines: 96, statements: 96, branches: 95, functions: 95 }
    },
  },
  resolve: {
    alias: {
      "@yoltra/core": path.resolve(__dirname, "../core/src/index.ts")
    }
  }
});
