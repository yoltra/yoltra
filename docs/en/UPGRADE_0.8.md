![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Upgrading to 0.8.0

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/UPGRADE_0.8.md)

Five behaviour changes, one hazard if you roll back, and a handful of additions. Most applications
need no code changes. Pre-1.0, so this is a MINOR bump by [the repository's policy](../../CONTRIBUTING.md).

> **Full guide:** [Upgrading to 0.8.0 on yoltra.dev](https://yoltra.dev/en/yoltra/releases/0.8/migration/)

## Behaviour changes

- [ ] **[Read this one first: rolling back loses binary state](https://yoltra.dev/en/yoltra/releases/0.8/migration/#read-this-one-first-rolling-back-loses-binary-state).**
  If you persist binary data, bump the `persist` schema `version` before shipping 0.8.0.
- [ ] **[`replace*` no longer removes what a library registered](https://yoltra.dev/en/yoltra/releases/0.8/migration/#replace-no-longer-removes-what-a-library-registered).**
  Pass `{ scope: "all" }` for the old behaviour; naming a slice a library mounted now throws.
- [ ] **[Middleware vetoes only on an explicit `false`](https://yoltra.dev/en/yoltra/releases/0.8/migration/#middleware-vetoes-only-on-an-explicit-false).**
  A middleware that returns `undefined` or another falsy value now allows the event.
- [ ] **[Time travel no longer re-runs your `onEvent` handlers](https://yoltra.dev/en/yoltra/releases/0.8/migration/#time-travel-no-longer-re-runs-your-onevent-handlers).**
  Opt back in with `{ duringReplay: true }`, or branch on `store.isReplaying`.
- [ ] **[`useAtomicProps` refuses an undeclared read](https://yoltra.dev/en/yoltra/releases/0.8/migration/#useatomicprops-refuses-an-undeclared-read).**
  Hooks from `createYoltra` or `createHooks` throw in development; declare the path you read.

## Additions you may want

[In full on yoltra.dev](https://yoltra.dev/en/yoltra/releases/0.8/migration/#additions-you-may-want):
`reason` and `vetoedBy` on `EmitResult`; typed decoration with `registerSlice` and `with*` (see the
[decoration guide](./DECORATION_GUIDE.md)); `store.onRegistrationChange`; `onSubscriberError`;
typed arrays, `DataView` and `ArrayBuffer` in state and storage; content dedup that compares
`Map`, `Set`, `Date`, `BigInt`, binary and cyclic payloads correctly.

## Nothing to do for

`createStore`, `emit`, `getState`, `subscribe`, `connect`, the entity adapter, Suspense hooks,
`store.call` (see the [request and reply guide](./REQUEST_REPLY_GUIDE.md)) and every existing
`registerX` call site. [More](https://yoltra.dev/en/yoltra/releases/0.8/migration/#nothing-to-do-for).

> **Full guide:** [Upgrading to 0.8.0 on yoltra.dev](https://yoltra.dev/en/yoltra/releases/0.8/migration/)
