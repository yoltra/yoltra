![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

# Upgrading to 0.10.0

> 👉 🇺🇸 English Version&nbsp; | &nbsp;[ 🇲🇽 Versión en Español](../es/UPGRADE_0.10.md)

One change can surface at startup: a reducer or an effect with a matcher that could never match
now throws when it is registered. Read that section first. The rest is a warning that now names
its store, two type fixes, typed arrays that now change as one value, and one new option on
`store.call()`. Most applications need no code
changes.

Pre-1.0, so this is a MINOR bump by [the repository's policy](../../CONTRIBUTING.md).

---

## A reducer or an effect with `channelPattern` now throws

**You will notice if:** a reducer or an effect is registered with `when: { channelPattern }`, or
any `when` takes none of the five forms. `createStore`, `registerReducer`, `registerSlice`,
`registerEffect`, `replaceReducers`, `replaceEffects` and `hotReplace` throw an `Error` naming the
registration. TypeScript reports it first: `ReducerSpec.when` and `EffectSpec.when` are now typed
`ExactWhen`.

`channelPattern` was only ever honoured by middleware. On a reducer or an effect it was accepted
without a word and **handled nothing**: the reducer never ran, so its slice stayed at its initial
state, and the effect was not even reported to `onRegistrationChange`. If your code registered one,
it has never worked, and this release makes that visible.

Reducers stay exact on purpose. Their input set has to stay closed, so that replaying a log
against the same code folds the same events whatever a decoration adds later. Effects for one
event run in sequence, and a pattern would enlist an effect in the chain of every channel it
matched.

```ts
// Before: accepted, and the reducer never ran.
store.registerReducer("plans", { state, when: { channelPattern: "*plan" }, reducer });

// After: name the channels the slice folds.
store.registerReducer("plans", { state, when: { channels: ["plan", "bb::plan"] }, reducer });
```

If the channels cannot be named in advance, keep the pattern on a middleware, where it is
supported.

**The same check now covers every seam.** A `when` of none of the five forms, such as `{}`,
`{ any: false }` or `{ keys: "plan" }`, throws on reducers, effects and middleware alike. It used
to match nothing. `{ keys: [] }` and `{ channels: [] }` are still accepted, because they are
well-formed and a list can legitimately be empty.

**A refused call changes nothing.** Each entry point checks the whole batch before it touches the
store, so a `replaceReducers` or `hotReplace` that throws leaves the previous reducers, effects and
middleware installed and running.

---

## The key-collision warning is kept per store

**You will notice if:** a process runs several stores in development, such as a test suite or a
server rendering more than one, and two `(channel, type)` pairs in one store join to the same
internal key.

The warning used to be remembered for the whole process. Once one store had reported a key, a second
store with the same collision stayed silent; and two stores that each used *one* of the pairs, which
cannot interfere, were reported as colliding. It is now kept per store and names the store. No code
change is needed; you may see a warning that was previously suppressed, or lose one that was wrong.

---

## `replaceReducers` and `hotReplace` type each slice on its own

**You will notice if:** you call `replaceReducers` or `hotReplace({ reducer })` on a store with two
or more slices, or on a store a library decorated.

The argument used to require every slice name and type each reducer with the union of every
slice's state. An annotated reducer failed to compile on any store with two slices, a reducer for
one slice could return another's state, and on a decorated store the only call that compiled named
the library's slice, which the runtime refuses. It is now `ReducerReplacement`: every key optional,
each typed with its own slice's state, which is what the runtime has done since 0.8.0. Code that
compiled before still compiles unless a reducer returned the wrong slice's state.

`EventFromWhen` also gains its `channelPattern` arm: it resolves to the whole event union, which is
what a middleware handler receives, instead of `never`.

---

## A disposed store is inert

**You will notice if:** anything emits to, calls, or registers on a store after `dispose()`, or a
call is still waiting for a reply when its store is disposed.

`dispose()` cleared the store's registries and left the rest running. An `emit` afterwards still
ran middleware and whatever reducers were left, a pending `call` waited out its idle timeout, and
nothing told work tied to the store that it was gone. Now:

- `emit()` resolves `{ committed: false, written: false }` without running anything.
- `call()` rejects at once with `CallAbortedError("store disposed")`, and a call still pending
  when the store is disposed rejects the same way.
- `registerReducer`, `registerSlice`, `registerMiddleware`, `registerEffect`, the `with*` and
  `onEffect` helpers, `replace*` and `hotReplace` throw an `Error` naming the store.
- A late `emit` or `call` is reported once per method in development, as `use-after-dispose`.
- `dispose()` is idempotent.

New: `store.signal`, an `AbortSignal` aborted last in `dispose()`, for tying resources to the
store's lifetime. See [Tying resources to the store](../../packages/core/README.md#tying-resources-to-the-store).

A `call()` whose own `signal` is already aborted also no longer sends its request or arms a timer:
it used to reject and send anyway.

---

## Persistence never writes a partial state

**You will notice if:** a persisted state can grow past 100 000 values, or you assert on what
`onError` receives under the `"encode"` phase, or on how many times an adapter is written.

`persist` encoded state up to a node budget and wrote whatever fit, replacing a complete earlier
snapshot with one cut off part-way. That snapshot then hydrated into state no reducer produced. A
state past the budget is now **not written**: storage keeps its previous value, and `onError`
receives a `PersistEncodeError` (new) with `truncated: true` and `written: false`. The budget is
`maxNodes`, new on `PersistOptions`, defaulting to the 100 000 it always was. `dehydrate` returns
`""` in that case, which hydrates as nothing to restore.

A value with no faithful representation is still written, as before, and is now reported as a
`PersistEncodeError` with `written: true` and its paths in `unsupported`, instead of a plain
`Error`. Its message still names the paths.

`persist` also writes only after an event that changed state. A vetoed or refused event, or a
reducer returning its input, used to schedule a rewrite of what storage already held.

---

## A typed array in state changes as one value

**You will notice if:** state holds a typed array, a `DataView` or an `ArrayBuffer`, and you read
`changedPaths`, `prevValues` or `nextValues` from `store.instrument()`, or connect to a path inside
one.

A typed array's indices are its own keys, so the change detector used to walk it like an object:
replacing a 4-byte `Uint8Array` reported four paths, one per byte, and an instrumentation observer
copied every byte that differed. A view is now one value at its own path, compared by reference,
which is how `Map` and `Set` were already treated. Replacing it reports its path once, with the old
and new views as the values; returning the same view is no change. A subscription to an index inside
a view, such as `buf.0`, is no longer notified; subscribe to the view's path instead.

The by-reference warning also tells binary data apart. A view cannot be frozen, so the old message
("it is now frozen ... will throw") was false for it: nothing throws, and a later write into the
buffer changes the slice in place, unseen by subscribers. The warning now says that, and it also
catches a buffer kept from a field of the payload, as `{ ...payload }` does.

---

## Additions you may want

**`ExactWhen<EM>`**, the `When` forms a reducer or an effect accepts (`When` without
`channelPattern`). Use it to type a helper that builds reducer or effect specs.

**`correlation` on `store.call()`.** `"either"` (the default, unchanged), `"causal"` or `"id"`. Use
`"id"` when a responder's protocol carries its own request id and keeps several requests in flight
on one channel: there, the parent link can point at the wrong request. See the
[request and reply guide](./REQUEST_REPLY_GUIDE.md).

**`ReducerReplacement<R, S, EM>`**, the argument `replaceReducers` takes, for typing an HMR handler
that builds the map before calling it.

**`clock` and `scheduler` on `createStore`**, with the `Clock`, `Scheduler` and `TimerHandle` types.
The store reads the time and arms every timer through them: deduplication windows, the dedup cache
prune, and the idle timeout of `store.call()`. `persist` takes a `scheduler` option too. The
defaults behave as before. See [Time and timers](../../packages/core/README.md#time-and-timers).

**`at`, `parentId` and `depth` on instrumented events.** `InstrumentedEvent.at` is the clock time
at which the store processed the event, and `event.parentId` and `event.depth` carry its causal
position, absent on a root event as they are on `Event`. An observer that records or traces events
no longer has to take its own timestamp or lose the chain. If you build `InstrumentedEvent` values
yourself, for a fake observer feed in a test, add `at`.

**`diagnostics` on `createStore`, and `store.onDiagnostic`.** Every failure the store contains,
every refusal and every development warning is now a `Diagnostic` with a stable `code`. The
owner's `diagnostics` sink replaces the console output; without one, the console output is
unchanged. `store.onDiagnostic` lets code attached later, such as a decoration, observe the same
diagnostics without silencing anything. The existing hooks still fire. See
[Errors and diagnostics](../../packages/core/README.md#errors-and-diagnostics).

`EventBus` and `LooseEventBus` take an optional handler-error callback in their constructor. It
defaults to the console, as before.

**`ctx` for effects, with `ctx.signal`.** An effect receives a fourth argument, an `EffectContext`
(new), whose `signal` aborts when the effect stops being registered: its disposer runs,
`replaceEffects` or `hotReplace` removes it, or the store is disposed. `onEffect` handlers receive
it as their fifth argument. Effects written with three parameters are unaffected. If you call an
`EffectFunction` yourself, in a test, pass a context: `{ signal: new AbortController().signal }`.

**`cancel` on `store.call()`**, with the `CallCancellation` and `CancelKey` types. Name an event
and the call emits it, with the request's id and the reason, when it is cancelled, aborted or times
out, so the responder can stop working. See the
[request and reply guide](./REQUEST_REPLY_GUIDE.md#telling-the-responder-you-gave-up).

**`ephemeral` channels, and `store.instrument(observer, { ephemeral })`.** Events on an ephemeral
channel are handled as usual but reach only instrumentation observers that opt in, and replay
skips them. Devtools agents do not opt in; `persist` does. The README's
[Traffic that is not history](../../packages/core/README.md#traffic-that-is-not-history) and
[Values that change many times a second](../../packages/core/README.md#values-that-change-many-times-a-second)
describe the pattern for high-frequency values. A `PersistableStore` you implement yourself should
accept the new optional second argument to `instrument`.
