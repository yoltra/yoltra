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
      exclude: [
        "dist",
        "./src/index.ts",
        "./src/types.ts",
        "**/*.d.ts",
        "**/*.config.ts",
        "/.rollup.config.js",
        "tests/store-basic-flow/support/reducers.ts",
        "tests/store-middleware-and-effects/support/setupStore.ts"
      ],
      thresholds: { lines: 0.95, branches: 0.95, functions: 0.95, statements: 0.95 }
    },
    // point to the renamed vitest tsconfig
    typecheck: { tsconfig: "tsconfig.vitest.json" }
  }
});
