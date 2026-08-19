import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/types.ts"],
      // Set at the measured floor. `withNodetools.ts` is the gap: 62% of its statements and
      // 44% of its branches are unexercised.
      thresholds: { lines: 63, statements: 63, branches: 54, functions: 84 },
    },
  },
});
