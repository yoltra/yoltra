![Quo.js logo](https://quojs.dev/assets/logo.svg)

# Quo.js

> [ 🇲🇽 Versión en Español](https://github.com/quojs/quojs/blob/main/docs/es/README.md)&nbsp; |
> &nbsp;[ 🇵🇹 Versão Portuguesa](https://github.com/quojs/quojs/blob/main/docs/pt/README.md)&nbsp;
> | &nbsp; 👉 [ 🇺🇸 English Version](https://github.com/quojs/quojs/blob/main/README.md)&nbsp; |
> &nbsp;[ 🇫🇷 Version française](https://github.com/quojs/quojs/blob/main/docs/fr/README.md)

![Bundle size](https://badgen.net/bundlephobia/min/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/minzip/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/tree-shaking/@quojs/core)
![Bundle size](https://badgen.net/bundlephobia/dependency-count/@quojs/core)
![npm downloads](https://badgen.net/npm/dm/@quojs/core)
![License](https://img.shields.io/npm/l/@quojs/core)

Declarative • Ultra‑simple • Expressive: Quo.js is a modern state management library inspired by
Redux—but without the Redux Toolkit baggage. It brings back the simplicity and power of the
original Redux pattern while introducing **channels + events**, **native async middleware &
effects**, **granular subscriptions**, and **React hooks ready for Suspense and Concurrent
Mode**.

## Packages

- **[@quojs/core](https://github.com/quojs/quojs/blob/main/packages/core/README.md)** — Core
  store, reducers, middleware, effects (framework‑agnostic)
- **[@quojs/react](https://github.com/quojs/quojs/blob/main/packages/react/README.md)** — React
  provider & hooks (Suspense/Concurrent‑ready)

## [Runnable Examples](https://github.com/quojs/quojs/tree/main/packages)

| Example                                                                                                                             | Description                                                                                                                                                                  | Screenshot                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **[Quo.js in React](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/README.md)**                                | A simple TODO application (check the [React Profiler](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md) comparison)               | ![Quo.js logo](https://quojs.dev/assets/examples/profiler-quojs-frame-15.png)         |
| **[Kinetic logo of Quo.js (React + SVG)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-kinetic-logo/README.md)**       | A kinetic logo made of ~1.5k SVG circles, driven by a tiny simulation engine and synchronized with a Quo.js store                                                            | ![Quo.js logo](https://quojs.dev/assets/examples/quojs-dots.gif)                      |
| **[Theme switcher App (Next.js v16 + Quo.js)](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-nextjs/README.md)** | a simple **theme switcher** (light ↔ dark) powered by `@quojs/core` and `@quojs/react`, proving Quo.js can manage application state seamlessly in **React 19 + Next.js 16**. | ![Quo.js logo](https://quojs.dev/assets/examples/quojs-in-nextjs--theme-switcher.png) |

## Why Quo.js?

- 🗪 **Channel + Event model** — actions are `{ channel, event, payload }`; reducers subscribe at
  exactly the granularity you need.
- 🎯 **Fine‑grained subscriptions** — subscribe to atomic props to avoid
  [**unnecessary renders**](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md).
- 🧭 **TypeScript‑first** — ergonomic typings and predictable APIs.
- ⚡ **Built‑in middleware & effects** — async by default; no thunk/saga boilerplate.
- 🧩 **Dynamic reducers** — add/remove reducers at runtime.
- 📌 **Lightweight** — small, focused surface.
- 🧭 **Framework‑agnostic** — React today; more adapters welcome.

## How does **Quo.js** compare to other state containers?

When evaluating a state manager, raw API surface isn’t the whole story. What matters most is the
philosophy behind it, the trade-offs it makes, and how those choices affect **developer
experience, performance, and scalability** in real projects.

Quo.js was designed as a pragmatic evolution of Redux’s original ideas: explicit events,
predictable state transitions, strong TypeScript typing, and built-in async/effect handling —
without the hidden “magic” or boilerplate of other ecosystems.

To help you decide if Quo.js is the right fit, we’ve prepared direct comparisons against other
popular libraries. Each document explores:

- **Conceptual model** (how state flows through actions, reducers, and effects)
- **Developer ergonomics** (boilerplate, typing, debugging tools)
- **Performance** (granularity of subscriptions, rendering efficiency)
- **Async & effects** (how workflows and side-effects are expressed)
- **React integration** (selectors, Suspense, concurrent mode readiness)

👉 Check out the comparisons
[here](https://github.com/quojs/quojs/blob/main/examples/v0/quojs-in-react/redux-quojs-profiler.md)

## Quick Start (Monorepo)

```bash
npm i -g @microsoft/rush
rush install
rush build
rush test
```

Focused builds:

```bash
rush build --to @quojs/core
rush build --from @quojs/react
```

See the **Developer Guide** for SDLC, caching, and releases:

- [Developer Guide](https://github.com/quojs/quojs/blob/main/docs/en/DEVELOPER_GUIDE.md)

## Docs

### Core

- [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/core/docs/README.md): a more
  technical documentation extracted using TypeDoc.
- [Developer Docs (WIP)](https://www.quojs.dev/?lang=en): quick-start guide, tutorial, recipes,
  etc.

### React bindings

- [TypeDoc](https://github.com/quojs/quojs/blob/main/packages/react/docs/README.md): a more
  technical documentation extracted using TypeDoc.
- [Developer Docs (WIP)](https://www.quojs.dev/?lang=en): quick-start guide, tutorial, recipes,
  etc.

## Contributing

- Start here — [Contributing guide](https://github.com/quojs/quojs/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/quojs/quojs/blob/main/CODE_OF_CONDUCT.md)
- [Governance](https://github.com/quojs/quojs/blob/main/GOVERNANCE.md)
- [Maintainers](https://github.com/quojs/quojs/blob/main/MAINTAINERS.md)
- [Security](https://github.com/quojs/quojs/blob/main/SECURITY.md)
- [Trademarks](https://github.com/quojs/quojs/blob/main/TRADEMARKS.md)

## Status

Quo.js is in **RC stage**. APIs are stable and **probably going to change**, types are strict,
and it’s used in production. Feedback and PRs welcome.

Made in 🇲🇽, for the world.
