// eslint.config.mjs
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";
import globals from "globals";

import { yoltraPlugin } from "./eslint/no-getstate-in-render.mjs";

const TYPED_FILES = ["**/src/**/*.{ts,tsx}"];

const typedBlocks = tseslint.configs.recommendedTypeChecked.map((c) => ({
  ...c,
  files: TYPED_FILES,
  languageOptions: {
    ...c.languageOptions,
    parserOptions: {
      projectService: true,
      tsconfigRootDir: process.cwd(),
      ...(c.languageOptions?.parserOptions ?? {}),
    },
  },
  rules: {
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
  },
}));

export default [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/node_modules/**",
      "common/temp/**",
      "**/*.d.ts",
      "**/tests/**",
      "**/repo-tools/**/*.mjs",
      "**/repo-tools/**/*.cjs"
    ],
  },

  js.configs.recommended,

  ...tseslint.configs.recommended,

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { tsconfigRootDir: process.cwd() },
      globals: { ...globals.browser, ...globals.node, JSX: "readonly" },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      import: importPlugin,
      yoltra: yoltraPlugin,
    },
    settings: { react: { version: "detect" } },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      // A store read in a render body subscribes to nothing, so the component renders once with
      // the value and never again. An error rather than a warning: it is not a style preference,
      // and the symptom — a screen that stops updating — appears far from the cause.
      "yoltra/no-getstate-in-render": "error",
    },
  },

  ...typedBlocks,

  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    languageOptions: {
      globals: {
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        vi: "readonly",
        beforeAll: "readonly",
        afterAll: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
  },
];
