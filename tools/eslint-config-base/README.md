# @yoltra/eslint-config-base

[![npm version](https://img.shields.io/npm/v/@yoltra/eslint-config-base)](https://www.npmjs.com/package/@yoltra/eslint-config-base)
[![npm downloads](https://img.shields.io/npm/dm/@yoltra/eslint-config-base)](https://www.npmjs.com/package/@yoltra/eslint-config-base)
[![License](https://img.shields.io/npm/l/@yoltra/eslint-config-base)](https://github.com/yoltra/yoltra/blob/main/LICENSE)

Shared ESLint **flat config** for Node.js + browser TypeScript libraries in the Yoltra monorepo.

## Install

```sh
npm install --save-dev @yoltra/eslint-config-base eslint typescript-eslint
```

`eslint` is a peer dependency (`>=9`).

## Usage

In your `eslint.config.js` (flat config):

```js
import base from "@yoltra/eslint-config-base";

export default [
  ...base,
  // your project-specific overrides
];
```

For React projects, use [`@yoltra/eslint-config-react`](https://github.com/yoltra/yoltra/tree/main/tools/eslint-config-react), which extends this base.

## License

MIT
