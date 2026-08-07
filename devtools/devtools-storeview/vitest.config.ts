import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Components need a DOM to render into; the pure-logic tests run in it happily too.
    environment: "jsdom",
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/index.tsx", "src/theme/**", "src/**/*.module.css"],
    },
  },
});
