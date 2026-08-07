import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      // Scoped to the shipped sources. Left unscoped, coverage measures whatever a run
      // happened to load — the trap that has now caught this repository twice.
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["src/index.ts", "src/client.ts", "**/*.d.ts"],
      // Integer percentages, not fractions. Vitest reads `0.95` as nine-tenths of one percent,
      // which is a gate that passes on almost no coverage at all.
      //
      // Set at today's measured floor so a regression fails the build. Raising them means
      // writing tests, not editing this line.
      thresholds: { lines: 97, statements: 97, branches: 95, functions: 96 },
    },
  },
});
