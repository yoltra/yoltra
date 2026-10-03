![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Upgrading to 0.10.0

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/UPGRADE_0.10.md)

Most applications need no code changes. One change can surface at startup: a reducer or an effect
with a matcher that could never match now throws when it is registered. Check that first. Pre-1.0,
so this is a MINOR bump by [the repository's policy](../../CONTRIBUTING.md).

> **Full guide:** [Upgrading to 0.10.0 on yoltra.dev](https://yoltra.dev/en/yoltra/releases/0.10/migration/)

## Behaviour changes

- [ ] **[A reducer or an effect with `channelPattern` now throws](https://yoltra.dev/en/yoltra/releases/0.10/migration/#a-reducer-or-an-effect-with-channelpattern-now-throws).**
  It never handled anything. Name the channels (`when: { channels: ["plan", "bb::plan"] }`) or keep
  the pattern on a middleware. A `when` of none of the five forms (`{}`, `{ any: false }`) now
  throws on every seam, and a refused `replaceReducers` or `hotReplace` leaves the store unchanged.
- [ ] **[A disposed store is inert](https://yoltra.dev/en/yoltra/releases/0.10/migration/#a-disposed-store-is-inert).**
  After `dispose()`, `emit()` resolves `{ committed: false, written: false }`, `call()` rejects with
  `CallAbortedError("store disposed")` and registration methods throw. Stop using a store after
  disposing it; tie resources to the new `store.signal`.
- [ ] **[Persistence never writes a partial state](https://yoltra.dev/en/yoltra/releases/0.10/migration/#persistence-never-writes-a-partial-state).**
  A state past `maxNodes` (100 000 by default) is not written and `onError` receives a
  `PersistEncodeError`. Writes happen only after an event that changed state.
- [ ] **[A typed array in state changes as one value](https://yoltra.dev/en/yoltra/releases/0.10/migration/#a-typed-array-in-state-changes-as-one-value).**
  Subscribe to the view's path, not to an index inside it such as `buf.0`.
- [ ] **[The key-collision warning is kept per store](https://yoltra.dev/en/yoltra/releases/0.10/migration/#the-key-collision-warning-is-kept-per-store).**
  No code change; a warning that was suppressed may now appear, and it names the store.
- [ ] **[`replaceReducers` and `hotReplace` type each slice on its own](https://yoltra.dev/en/yoltra/releases/0.10/migration/#replacereducers-and-hotreplace-type-each-slice-on-its-own).**
  Every key is optional (`ReducerReplacement`); fix a reducer that returned another slice's state.
  `EventFromWhen` now resolves `channelPattern` to the whole event union.

## Additions you may want

All are described in the [full guide](https://yoltra.dev/en/yoltra/releases/0.10/migration/#additions-you-may-want):

- `ExactWhen<EM>` and `ReducerReplacement<R, S, EM>`, for typing spec builders and HMR handlers.
- `correlation` and `cancel` on `store.call()` (see the [request and reply guide](./REQUEST_REPLY_GUIDE.md)).
- `clock` and `scheduler` on `createStore`, and a `scheduler` option on `persist`.
- `at`, `parentId` and `depth` on instrumented events.
- `diagnostics` on `createStore` and `store.onDiagnostic`; a handler-error callback on `EventBus`.
- `ctx.signal` for effects, and `store.signal` for the store.
- `ephemeral` channels, and `store.instrument(observer, { ephemeral })`.
- `warnOnLargeValues(store, limits?)`, a development-only size check.
- `matchesWhen` and `describeWhenProblem`, for matching outside the store.
- `store.instrumentEffects()`, `store.metrics()` and `store.whenIdle()`.
- `persist()`'s stop function returns a promise that settles after the last write.

## More on yoltra.dev

- [Upgrading to 0.10.0](https://yoltra.dev/en/yoltra/releases/0.10/migration/), with every change explained.
- [Release notes for 0.10](https://yoltra.dev/en/yoltra/releases/0.10/notes/) and [what's new in 0.10](https://yoltra.dev/en/yoltra/releases/0.10/).

> **Full guide:** [Upgrading to 0.10.0 on yoltra.dev](https://yoltra.dev/en/yoltra/releases/0.10/migration/)
