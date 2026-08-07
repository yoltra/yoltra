import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      // `cli.ts` starts a hub and owns the process; `connection.ts` is type declarations.
      exclude: ["src/index.ts", "src/cli.ts", "src/connection.ts", "bin/**"],
      // At the measured level: the router and ring buffer are fully covered, the hub is at
      // roughly three quarters, and this stops that slipping.
      thresholds: { lines: 85, statements: 85, branches: 88, functions: 90 },
    },
  },
});
