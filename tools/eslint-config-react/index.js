import baseConfig from "@yoltra/eslint-config-base";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

/**
 * Shared ESLint flat config for React + TypeScript libraries.
 *
 * Extends @yoltra/eslint-config-base and adds:
 *   - eslint-plugin-react-hooks (recommended)
 *   - eslint-plugin-react-refresh (Vite HMR safety)
 *
 * Usage in a consuming package:
 *
 *   // eslint.config.mjs
 *   import reactConfig from "@yoltra/eslint-config-react";
 *   export default reactConfig;
 *
 * Or extend with package-specific overrides:
 *
 *   // eslint.config.mjs
 *   import reactConfig from "@yoltra/eslint-config-react";
 *   export default [
 *     ...reactConfig,
 *     { rules: { "react-refresh/only-export-components": "off" } },
 *   ];
 *
 * @type {import("typescript-eslint").Config}
 */
export default [
  ...baseConfig,
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Enforce the Rules of Hooks (no conditional calls, exhaustive deps).
      ...reactHooks.configs["recommended-latest"].rules,

      // Warn when a module exports non-component values alongside components,
      // which can break Vite's Fast Refresh boundary detection.
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },
];
