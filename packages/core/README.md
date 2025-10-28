![Quo.js logo](../../assets/logo.svg)

# Quo.js The state of things, rewritten.

> [ 🇲🇽 Versión en Español](./README.es.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](./README.pt.md)&nbsp; | &nbsp; 👉
> [ 🇺🇸 English Version](./README.md)&nbsp; | &nbsp;[ 🇫🇷 Version française](./README.fr.md)

**Quo.js** is a modern, framework-agnostic state management library inspired by Redux — without
the Toolkit bloat. It introduces **channels + events**, **native async middleware & effects**,
and **atomic subscriptions**.

> Works in **browsers and Node**. No DOM assumptions. Suitable for Node 18+, Bun, and Deno (with
> ESM).

> [Versión en Español](./README.es.md)

## Install

```bash
npm i @quojs/core
```

## Why Quo.js?

- 🔗 **Channel + Event model** — `{ channel, event, payload }` for natural modularity
- 🎯 **atomic subscriptions** — atomic change tracking
- ⚡ **Async middleware & effects** — built-in, no thunk/saga
- 🛡 **TypeScript-first** — ergonomic, predictable types
- 🧩 **Dynamic reducers** — add/remove at runtime
- 🧭 **Framework-agnostic** — pair with `@quojs/react` or use headless in Node

## Docs

- [Developer Docs](https://quojs.dev/?lang=en): quick-start guide, tutorial, recipes,
  etc.
- [TypeDoc](./docs/en/README.md): a more technical documentation extracted using TypeDoc.

## Links

- [Monorepo](../../)
- [Governance](../../GOVERNANCE.md)
- [Code of conduct](../../CODE_OF_CONDUCT.md)
- [Contrituting guide](../../CONTRIBUTING.md)

## Status

**RC-stage**. Stable APIs (potentially changing), strict types, production use. Feedback and PRs
welcome.

Made in 🇲🇽 for the world.
