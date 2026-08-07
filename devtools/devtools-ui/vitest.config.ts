import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // React hooks need a renderer to execute. The logic worth gating was deliberately taken
      // out of them — `stateReplay`, `timeTravelNav`, `snapshotRetry` — precisely so it could be
      // tested directly; rendering the hooks themselves is tracked UI-test work.
      exclude: ["src/index.ts", "src/types.ts", "src/hooks/use*.ts", "src/context/**"],
      thresholds: { lines: 88, statements: 88, branches: 80, functions: 82 },
    },
  },
});
