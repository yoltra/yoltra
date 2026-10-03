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
      // Set at the measured floor. The mount test renders the whole app and `panels.test.tsx`
      // renders each panel with data, which lifted lines and statements from 16% to 89% and
      // functions from 86% to 93%. Branches sit below their earlier 83%: rendering a component
      // brings its inner branches into the count, and the panels' many display conditions are
      // mostly untested. Raising it means testing the panels, not narrowing what is measured.
      thresholds: { lines: 89, statements: 89, branches: 76, functions: 93 },
    },
  },
});
