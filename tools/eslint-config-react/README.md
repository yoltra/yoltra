# @yoltra/eslint-config-react

Shared ESLint **flat config** for React + TypeScript libraries in the Yoltra monorepo. Extends [`@yoltra/eslint-config-base`](../eslint-config-base) with the React Hooks and React Refresh rules.

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
