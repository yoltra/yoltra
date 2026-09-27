# @yoltra/eslint-config-react

[![npm version](https://img.shields.io/npm/v/@yoltra/eslint-config-react)](https://www.npmjs.com/package/@yoltra/eslint-config-react)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/eslint-config-react)](https://www.npmjs.com/package/@yoltra/eslint-config-react)
[![License](https://img.shields.io/npm/l/@yoltra/eslint-config-react)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

Shared ESLint **flat config** for React + TypeScript libraries in the Yoltra monorepo. Extends [`@yoltra/eslint-config-base`](https://github.com/yoltra/yoltra/tree/main/tools/eslint-config-base) with the React Hooks and React Refresh rules.

## Install

```sh
npm install --save-dev @yoltra/eslint-config-react eslint typescript-eslint
```

`eslint` is a peer dependency (`>=9`).

## Usage

In your `eslint.config.js` (flat config):

```js
import react from "@yoltra/eslint-config-react";

export default [
  ...react,
  // your project-specific overrides
];
```

This already includes the base config, so you do not need to spread both.

## License

MIT
