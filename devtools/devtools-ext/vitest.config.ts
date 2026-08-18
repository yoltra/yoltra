import { defineConfig } from "vitest/config";

/**
 * The coverage block below is declared but not yet enforced: gating needs `@vitest/coverage-v8`
 * as a devDependency, which the three sibling packages running plain `vitest --watch=false` also
 * lack. Add that dependency and `--coverage` to the test script to turn the thresholds on — they
 * are set to what these tests already achieve, so it should pass on the first run.
 */
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // The two relay halves are the whole reason this package exists, and they are pure logic
      // behind `chrome.*` — so they are covered. What is excluded genuinely cannot be reached
      // without a browser: `panel.ts` mounts the store-view UI and talks to `chrome.devtools`,
      // and `devtools.ts` / `popup.ts` are a `createPanel` call and a link handler respectively.
      exclude: ["src/panel.ts", "src/devtools.ts", "src/popup.ts"],
      thresholds: { lines: 90, statements: 90, branches: 85, functions: 90 },
    },
  },
});
