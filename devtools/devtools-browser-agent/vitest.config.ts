import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // The barrel re-exports and `types.ts` declares; neither runs, so both would be measured
      // as uncovered code that cannot be covered. Everything else here is ordinary logic with
      // no renderer in the way, so nothing else is excluded.
      exclude: ["src/index.ts", "src/types.ts"],
      // Set at the measured floor. `withDevtools.ts` carries the gap at 55% branches.
      thresholds: { lines: 79, statements: 79, branches: 67, functions: 72 },
    },
  },
});
