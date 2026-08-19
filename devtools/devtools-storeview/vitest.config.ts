import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Components need a DOM to render into; the pure-logic tests run in it happily too.
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      // The components are untested rather than untestable: this package already runs jsdom and
      // `JsonTree.tsx` is covered through it. They stay in the measurement so the number says
      // what is true, and the threshold below is low because that is the honest figure.
      exclude: ["src/index.tsx", "src/theme/**", "src/**/*.module.css", "src/global.d.ts"],
      // Set at the measured floor. Statements sit low because the panels carry no tests yet.
      // Raising it means testing them, not narrowing what is measured.
      thresholds: { lines: 16, statements: 16, branches: 83, functions: 86 },
    },
  },
});
