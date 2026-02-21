import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

/**
 * Shared ESLint flat config for Node.js + browser TypeScript libraries.
 *
 * Extends:
 *   - @eslint/js recommended
 *   - typescript-eslint recommended
 *
 * Targets files matching **\/*.{ts,tsx,mts,cts}.
 *
 * Usage in a consuming package:
 *
 *   // eslint.config.mjs
 *   import baseConfig from "@yoltra/eslint-config-base";
 *   export default baseConfig;
 *
 * Or extend with package-specific overrides:
 *
 *   // eslint.config.mjs
 *   import baseConfig from "@yoltra/eslint-config-base";
 *   export default [
 *     ...baseConfig,
 *     { rules: { "no-console": "off" } },
 *   ];
 *
 * @type {import("typescript-eslint").Config}
 */
export default tseslint.config(
  {
    // Patterns that should never be linted
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      ".typedoc/**",
      "**/*.d.ts",
    ],
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Downgrade to a warning so it does not block PRs when experimenting,
      // but still surfaces typing gaps in code review.
      "@typescript-eslint/no-explicit-any": "warn",

      // Allow unused vars/args that are intentionally prefixed with underscore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Allow console.warn and console.error for library-level diagnostics.
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
);
