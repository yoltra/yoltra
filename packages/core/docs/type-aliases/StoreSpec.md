![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreSpec

# Type Alias: StoreSpec\<R, S, EM\>

> **StoreSpec**\<`R`, `S`, `EM`\> = `object`

Defined in: [types.ts:662](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L662)

Store configuration object passed to the [Store](../classes/Store.md) constructor or [createStore](../functions/createStore.md).

## Example

```ts
type S = { counter: { value: number } };
type EM = { ui: { increment: number } };

const spec: StoreSpec<'counter', S, EM> = {
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      when: { keys: eventKeys<EM>()([['ui', 'increment']]) },
      reducer(s, evt) {
        if (evt.type === 'increment') return { value: s.value + evt.payload };
        return s;
      }
    }
  }
};
```

## Type Parameters

### R

`R` *extends* `string`

Reducer name union (string literal union).

### S

`S` *extends* `Record`\<`R`, `any`\>

State record keyed by `R`.

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

## Properties

### clock?

> `optional` **clock**: [`Clock`](../interfaces/Clock.md)

Defined in: [types.ts:737](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L737)

Where the store reads the time: deduplication windows and [InstrumentedEvent.at](../interfaces/InstrumentedEvent.md#at).

#### Remarks

Inject one to control time in a test, or to give every library a host configures the same
clock. The default reads `Date.now()` at each call, so fake timers installed after the store
was created still apply. Durations such as [InstrumentedEvent.reduceTimeMs](../interfaces/InstrumentedEvent.md#reducetimems) are measured
with `performance.now()` either way.

#### Default

`{ now: () => Date.now() }`

***

### dedupWindowMs?

> `optional` **dedupWindowMs**: `number`

Defined in: [types.ts:703](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L703)

Time window in milliseconds for **content-based** event deduplication.
When greater than 0, events with identical fingerprints
(channel + type + serialized payload) within this window are treated as
duplicates and skipped.

**Off by default.** Content-based dedup can silently drop legitimate
rapid-fire identical events (double-clicks, repeated `+1`, sliders emitting
the same value), so it is opt-in. To safely coalesce a *specific* re-fired
emit (e.g. React Strict Mode), prefer the per-emit [EmitOptions.dedupKey](../interfaces/EmitOptions.md#dedupkey).

#### Default

```ts
0 (disabled)
```

***

### devtools?

> `optional` **devtools**: `object`

Defined in: [types.ts:758](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L758)

DevTools configuration options.

#### allowReplay?

> `optional` **allowReplay**: `boolean`

Enable event replay via `__replayEvents()`.
When `false` (default), calling `__replayEvents()` throws.

##### Default

```ts
false
```

#### Remarks

These options control runtime DevTools capabilities such as event replay.

***

### diagnostics?

> `optional` **diagnostics**: [`DiagnosticSink`](DiagnosticSink.md)

Defined in: [types.ts:908](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L908)

Where the store sends its diagnostics: every failure it contained, every refusal, and its
development warnings. See [Diagnostic](../interfaces/Diagnostic.md).

#### Remarks

Without a sink the store writes to the console exactly as it always has. With one, the sink
replaces that output: the store's owner decides where its diagnostics go, and the store
itself writes nothing. The `on*` hooks above are still called either way.

A sink that throws is ignored; it cannot break the store. Observers added later with
[StoreInstance.onDiagnostic](../interfaces/StoreInstance.md#ondiagnostic) receive the same diagnostics, in addition to this sink.

***

### effects?

> `optional` **effects**: [`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:688](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L688)

Optional side-effect handlers registered at construction time.
Runs after reducers for every propagated event.

***

### idFactory()?

> `optional` **idFactory**: () => `string`

Defined in: [types.ts:724](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L724)

Generates the `id` for each emitted event. Defaults to `crypto.randomUUID()`.

#### Returns

`string`

#### Remarks

Two reasons to override it. First, portability: `crypto.randomUUID` requires a **secure
context** in browsers and is absent on some runtimes (React Native / Hermes), where the
default would throw on every emit. Second, determinism: injecting a counter makes event
ids stable across runs, which is what allows byte-exact assertions in tests.

The factory must return a string. Uniqueness is the caller's responsibility.

#### Default

```ts
() => crypto.randomUUID()
```

#### Example

```ts
let n = 0;
const store = createStore({ name: 'Test', reducer, idFactory: () => `evt-${++n}` });
```

***

### maxReduceDepth?

> `optional` **maxReduceDepth**: `number`

Defined in: [types.ts:838](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L838)

Maximum causal depth of an event chain before the store refuses to extend it.

#### Remarks

An event emitted while handling another is one deeper than its cause. Two reducers wired to
each other, or an effect that emits the event its own reducer answers, climb this without
bound — and the reduce queue drains synchronously, so in a browser that is a frozen tab with
no error and no stack, and on a server a pinned core.

**On by default**, because the whole point is that the failure mode does not require
configuration to avoid. The default is far past any legitimate chain: an event caused by an
event caused by an event is normal, sixty-four deep is a bug. Raise it if an application
genuinely nests deeper, or set `Infinity` to opt out entirely and own the consequences.

Breaching does not throw — see [StoreSpec.onCascade](#oncascade).

#### Default

```ts
64
```

***

### maxTransitionsPerDrain?

> `optional` **maxTransitionsPerDrain**: `number`

Defined in: [types.ts:860](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L860)

Maximum number of events one synchronous drain will process before refusing more.

#### Remarks

A drain processes one root event plus every event emitted *while it runs* — so this counts a
single causal burst, not application traffic. A plain loop is unaffected: `emit` drains to
completion before it returns, so `for (const row of rows) store.emit(…)` is a thousand drains
of one event each, never one drain of a thousand.

**Off by default** because a wide burst is not by itself a bug. One `sync` event whose
subscriber fans out to five hundred `upsert`s is a legitimate shape, and a default low enough
to catch a runaway would refuse it. Depth is what separates a cascade from a fan-out — a
fan-out is wide and shallow, a cascade is narrow and deep — which is why
[StoreSpec.maxReduceDepth](#maxreducedepth) carries the default and this does not.

Set it when a store's bursts are known to be bounded and an unexpectedly wide one is itself
the symptom worth catching.

#### Default

```ts
undefined (no limit)
```

***

### middleware?

> `optional` **middleware**: [`MiddlewareInput`](MiddlewareInput.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:682](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L682)

Middleware chain executed before reducers/effects.
Accepts either functions (legacy) or MiddlewareSpec objects (recommended).

An event stops propagating only when a middleware returns an explicit `false`, or
throws. Returning nothing allows it. Middleware is synchronous: a `Promise` is not
`false`, so it cannot veto.

***

### name

> **name**: `string`

Defined in: [types.ts:666](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L666)

Store name (used by DevTools to identify the instance).

***

### onCascade()?

> `optional` **onCascade**: (`info`) => `void`

Defined in: [types.ts:875](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L875)

Called when a ceiling is breached, instead of throwing.

#### Parameters

##### info

[`CascadeInfo`](../interfaces/CascadeInfo.md)\<`EM`\>

Which ceiling, the event that would have extended the chain, and its causal
chain of ids, newest last.

#### Returns

`void`

#### Remarks

The offending emit is refused and the chain stops there; everything already committed
stands. It does not throw, because the throw would surface in whichever frame happened to be
emitting — a subscriber, an effect, a middleware — which is the same species of
hard-to-attribute failure the ceiling exists to prevent. A cascade is a wiring bug, and this
is where the wiring gets named.

***

### onEffectError()?

> `optional` **onEffectError**: (`error`, `event`) => `void`

Defined in: [types.ts:781](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L781)

Called when an effect throws or its returned promise rejects.

#### Parameters

##### error

`unknown`

The thrown value or rejection reason.

##### event

[`EventUnion`](EventUnion.md)\<`EM`\>

The event whose effect failed.

#### Returns

`void`

#### Remarks

`await emit(...)` **never rejects** on effect failure: the reduce phase has
already committed synchronously, and effects run as independent per-event
tasks. Effect errors are logged to the console and delivered here (when
provided), so this is the single place to observe and route them — e.g.
report to a service or emit a failure event. Other effects still run.

***

### onReducerError()?

> `optional` **onReducerError**: (`error`, `event`, `slice`) => `void`

Defined in: [types.ts:801](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L801)

Invoked when a reducer throws.

#### Parameters

##### error

`unknown`

The thrown value.

##### event

[`EventUnion`](EventUnion.md)\<`EM`\>

The event being reduced when it threw.

##### slice

`string`

Name of the slice whose reducer threw.

#### Returns

`void`

#### Remarks

A reducer is meant to be pure and total, so a throw is a bug in application code — and it
used to be almost invisible. Keyed reducers ran through a bus that logged and moved on,
letting the event commit and its effects run; pattern reducers threw straight out of the
drain, aborting the commit and notifying nobody. Both paths now isolate the failing slice
and report here.

The failing slice keeps its previous state; every other slice still reduces, and the event
still commits if anything else changed. `emit()` never rejects because of a reducer error,
so this hook is how a caller observes one.

***

### onRejected()?

> `optional` **onRejected**: (`rejection`, `event`, `slice`) => `void`

Defined in: [types.ts:894](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L894)

Called when a reducer refuses a write by returning [Rejected](../functions/Rejected.md).

#### Parameters

##### rejection

[`Rejection`](../interfaces/Rejection.md)

The refusal and its reason.

##### event

[`EventUnion`](EventUnion.md)\<`EM`\>

The event that was refused.

##### slice

`string`

Name of the slice whose reducer refused.

#### Returns

`void`

#### Remarks

The caller learns of its own refusal from the `emit` result; this is for everyone else —
logging, metrics, alerting on a rate of rejected writes. Shaped as a callback rather than a
subscription for the same reason [StoreSpec.onReducerError](#onreducererror) is: it is a rare global
signal, not something several independent parties register and unregister for.

A refusal is a normal outcome, not an error. It means a reducer considered the write and
declined it — a stale compare-and-swap, an unmet precondition — and the event is rejected
whole, so no slice writes.

***

### onSubscriberError()?

> `optional` **onSubscriberError**: (`error`, `event`, `phase`) => `void`

Defined in: [types.ts:814](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L814)

Called when an `onEvent` subscriber throws, or rejects.

#### Parameters

##### error

`unknown`

##### event

[`EventUnion`](EventUnion.md)\<`EM`\>

##### phase

[`NotifiedPhase`](NotifiedPhase.md)

#### Returns

`void`

#### Remarks

The fourth of a set: reducers, effects, rejections and cascades all had a hook, and event
subscribers had `console.error` and nothing else - so an application could not route a
failing subscriber to its own error reporting. Subscribers are the seam a decoration is
told to use, which makes the gap more visible than it was.

A throwing subscriber never stops the others, with or without this hook.

***

### reducer

> **reducer**: `{ [K in R]: ReducerSpec<S[K], EM> }`

Defined in: [types.ts:672](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L672)

Map of slice name → reducer spec.
Each entry declares initial state, the reducer function, and the event targeting.

***

### scheduler?

> `optional` **scheduler**: [`Scheduler`](../interfaces/Scheduler.md)

Defined in: [types.ts:750](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L750)

Where the store arms its timers: the deduplication cache prune and the idle timeout of
`store.call()`.

#### Remarks

The default calls the global `setTimeout` and `clearTimeout` when a timer is armed or
cleared, so fake timers installed after the store was created still apply. `persist` takes
its own, `PersistOptions.scheduler`.

#### Default

the global `setTimeout` and `clearTimeout`
