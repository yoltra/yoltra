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
      // Set at the measured floor, not an aspiration. The app is rendered whole (the Emit keys
      // and the token tests) and each panel with data (`panels.test.tsx`), which lifted
      // statements and lines from 11% while keeping every function covered. Rendering a
      // component also brings its inner functions and branches into the counts, which is why
      // the panel tests exist: without them the whole-app render alone measured 70% functions.
      // Raising this is real work and should move the number rather than the exclude list.
      thresholds: { lines: 87, statements: 87, branches: 94, functions: 100 },
    },
  },
});
