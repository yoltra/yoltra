import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // Only the type-only declaration is excluded. The Ink components are untested rather
      // than untestable, so they stay in the measurement: excluding them would report a number
      // that describes `args.ts` alone while the package reads as fully covered.
      exclude: ["src/**/*.d.ts"],
      // Set at the measured floor, not an aspiration. Statements sit low because the Ink
      // components carry no tests yet; raising this is real work and should move the number
      // rather than the exclude list.
      thresholds: { lines: 11, statements: 11, branches: 94, functions: 100 },
    },
  },
});
