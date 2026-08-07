import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    exclude: [
      "dist",
      "node_modules",
      "./src/index.ts",
      "./src/types.ts",
      "global.d.ts",
      "vite.config.ts",
      "/.rollup.config.js",
    ],
    coverage: {
      reporter: ["text", "html", "lcov"],
      // Scoped to the shipped sources. Without this, coverage measured whatever a run
      // happened to load — test support files were being excluded one path at a time, and a
      // type-only test file, which by design executes nothing, counted as 0% and dragged the
      // aggregate below the gate.
      include: ["src/**/*.ts"],
      exclude: [
        "dist",
        "./src/index.ts",
        // Sub-barrels, excluded for the same reason as the root: pure re-export files whose
        // two lines either run on any import or never run at all.
        "./src/eventBus/index.ts",
        "./src/utils/index.ts",
        "./src/types.ts",
        "**/*.d.ts",
        "**/*.config.ts"
      ],
      // Percentages, not fractions. These read as `0.95%` before, so the gate everyone believed
      // was enforcing 95% coverage passed at essentially zero and never once failed a build.
      //
      // Set per metric at the measured floor rather than a flat aspiration: a threshold that
      // fails on the day it lands teaches the team to bypass it. All four now hold the
      // documented 95% — branches and functions were raised there once the uncovered paths
      // gained real tests rather than by wishing.
      thresholds: { lines: 95, statements: 95, branches: 95, functions: 95 }
    },
    // point to the renamed vitest tsconfig
    typecheck: { tsconfig: "tsconfig.vitest.json" }
  }
});
