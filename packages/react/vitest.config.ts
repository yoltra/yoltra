import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],

    include: [
      "tests/**/*.test.{ts,tsx}",
      "src/**/*.test.{ts,tsx}",
      "**/__tests__/**/*.{ts,tsx}"
    ],
    exclude: [
      "common",
      "dist",
      "node_modules",
      "tests/helpers/**",
      "global.d.ts",
      "vite.config.ts"
    ],

    coverage: {
      reporter: ["text", "html", "lcov"],
      exclude: [
        "dist",
        "common",
        "src/index.ts",
        "src/types.ts",
        "**/*.d.ts",
        "**/*.config.ts",
        "tests"
      ],
      thresholds: { lines: 0.95, branches: 0.95, functions: 0.95, statements: 0.95 }
    },
  },
  resolve: {
    alias: {
      "@yoltra/core": path.resolve(__dirname, "../core/src/index.ts")
    }
  }
});
