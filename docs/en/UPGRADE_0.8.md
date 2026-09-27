![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Upgrading to 0.8.0

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/UPGRADE_0.8.md)

Five behaviour changes, one hazard if you roll back, and a handful of additions. Most
applications need no code changes at all. Read the first section regardless; it is the one
that can bite silently.

Pre-1.0, so this is a MINOR bump by [the repository's policy](../../CONTRIBUTING.md).

---

## Read this one first: rolling back loses binary state

State persisted by 0.8.0 containing a `Uint8Array`, a `DataView` or an `ArrayBuffer` carries a
tag that 0.7.x does not recognise. Its decoder returns `undefined` for an unknown tag, so
**downgrading silently loses that slice**. Not an error, not a warning: the slice comes back
empty.

This only matters if you persist binary data and then deploy an older build.

```ts
// Bump the schema version before shipping 0.8.0, so an older build discards the
// payload instead of half-reading it.
persist(store, { key: "app", adapter, version: 4 /* was 3 */ });
```

---

## `replace*` no longer removes what a library registered

**You will notice if:** you call `replaceReducers`, `replaceMiddleware`, `replaceEffects` or
`hotReplace`, *and* something registers on the store after construction.

A reducer, middleware or effect added with `registerReducer`, `registerMiddleware` or
`registerEffect` now survives a `replace*` call, along with its state. Those registrations were
never part of the set you are replacing.

This fixes far more than it changes. The HMR line core's own documentation recommended used to
delete a library's slice **and its state** on the first file save, and it silently turned the
disposers `registerMiddleware` handed back into no-ops.

```ts
// Old behaviour, if you actually want it:
store.replaceReducers(next, { scope: "all" });
store.hotReplace({ reducer: next, scope: "all" }); // forwards to all three
```

**One new error.** If your `next` names a slice a library already mounted, `replaceReducers`
now throws, naming the slice and its owner, before mutating anything. Rename the slice, or pass
`{ scope: "all" }` deliberately.

---

## Middleware vetoes only on an explicit `false`

**You will notice if:** a middleware of yours returns `undefined`, `0`, `""`, `null` or `NaN`
and you were relying on that to block the event.

```ts
// Before: vetoed everything it matched, silently.
// Now:    allows the event, which is almost certainly what was meant.
store.registerMiddleware((state, event) => {
  log(event);          // no return
});

// Unchanged: an explicit false still vetoes, and so does a throw.
store.registerMiddleware(() => false);
```

The documented contract always said `false`. The test was `!result`, so any falsy value vetoed,
and middleware that did its work and fell off the end swallowed every event it matched. The
symptom was reducers quietly stopping for one channel, which reads as a routing problem.

`MiddlewareFunction` now returns `boolean | void`, so an omitted return is legal.

---

## Time travel no longer re-runs your `onEvent` handlers

**You will notice if:** you use `devtools: { allowReplay: true }` *and* you have an `onEvent`
handler you *want* to run during a scrub.

Replay used to call every handler exactly as a live event would, so dragging the timeline
re-published to peers, re-wrote to sockets and re-fired analytics for events that were not
happening again. There was no way to detect it from inside a handler.

```ts
// Opt back in, for a handler that derives view state and performs no I/O.
store.onEvent("ui", "save", handler, "committed", { duringReplay: true });

// In React:
useEvent("ui", "save", handler, "committed", { duringReplay: true });

// And for anything that must branch rather than skip:
if (store.isReplaying) { /* ... */ }
```

`subscribe` and `connect` keep firing throughout, so the UI still follows the scrub.

---

## `useAtomicProps` refuses an undeclared read

**You will notice if:** a selector reads state it did not declare, and you get your hooks from
`createYoltra` or `createHooks`.

```ts
// Throws in development now, naming the path.
useAtomicProps([{ reducer: "user", property: "name" }], (s) => s.user.email);
```

This guard already existed on the package-level hooks. It was missing from the ones
`createYoltra` hands out, which is the path the documentation recommends, so the recommended
path was the unguarded one. In production the read was `undefined` and the component simply
stopped updating, because it is subscribed only to what it declared. Declare the path, or stop
reading it.

---

## Additions you may want

**Knowing why an emit did not commit.** `committed: false` used to arrive from three unrelated
causes through one shared object.

```ts
const result = await store.emit("orders", "submit", order);
if (!result.committed) {
  if (result.reason === "vetoed") showError(`Blocked by ${result.vetoedBy ?? "a guard"}`);
  // "deduped" is a double-click. Say nothing.
  // "cascade" means the event exceeded the depth ceiling.
}
```

**Decorating a store, with types.** `registerSlice`, `withSlice`, `withMiddleware` and
`withEffect` return the store re-typed, so a slice added at runtime is visible to `getState()`
and its channels become emittable. See the [decoration guide](./DECORATION_GUIDE.md).

**Watching registrations.** `store.onRegistrationChange(observer, { emitCurrent: true })` fires
when the store gains or loses a reducer, middleware or effect.

**A hook for subscriber errors.** `createStore({ onSubscriberError })` joins `onEffectError`,
`onReducerError`, `onRejected` and `onCascade`.

**Binary in state and in storage.** All nine typed arrays plus `DataView` and `ArrayBuffer`
round-trip through persistence and time travel. They also no longer throw at store
construction, which they did in development because freezing a view is a `TypeError`.

**Honest deduplication.** `dedupWindowMs` compares by content for `Map`, `Set`, `Date`,
`BigInt`, binary and cyclic payloads. Those all stringified to `{}` before, so **distinct
payloads collided and the second event was silently dropped.** If you use content dedup, you
may see events now arriving that were previously swallowed. That is the fix, not a regression.

---

## Nothing to do for

`createStore`, `emit`, `getState`, `subscribe`, `connect`, the entity adapter, Suspense hooks,
`store.call`, and every existing `registerX` call site. The registration methods return a
callable object now instead of a bare function, so `const off = store.registerEffect(spec);
off();` compiles and runs exactly as before.

> **`store.call` is unchanged in 0.8.0, not absent.** It arrived in **0.6.0** with reply
> specifications, streaming progress with real backpressure, an idle rather than total timeout,
> `AbortSignal` and `cancel()`, and none of it moved since. If you are meeting it for the first
> time while upgrading, it is documented in full in the
> [Request & Reply guide](./REQUEST_REPLY_GUIDE.md) — this page is silent on it only because
> there is nothing to do.
