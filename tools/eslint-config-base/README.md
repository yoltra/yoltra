# @yoltra/eslint-config-base

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

For React projects, use [`@yoltra/eslint-config-react`](../eslint-config-react), which extends this base.

## License

MIT
