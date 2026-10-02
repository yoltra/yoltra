![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Store

# Class: Store\<EM, R, S\>

Defined in: [store/Store.ts:313](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L313)

A store: its state, the event pipeline that changes it, and the subscriptions it notifies.

## Remarks

Create one with [createStore](../functions/createStore.md), which infers the type parameters from the spec; the class
is exported for typing. Each event emitted runs through middleware, is reduced by every slice
whose `when` matches it, is committed as one state change, and then reaches subscribers and
effects. [StoreInstance](../interfaces/StoreInstance.md) describes the whole surface.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

The event map: channel, then type, then payload.

### R

`R` *extends* `string`

The slice names.

### S

`S` *extends* `Record`\<`R`, `any`\>

The state, keyed by slice name.

## Implements

- [`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

## Constructors

### Constructor

> **new Store**\<`EM`, `R`, `S`\>(`spec`): `Store`\<`EM`, `R`, `S`\>

Defined in: [store/Store.ts:881](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L881)

Creates a store from a [StoreSpec](../type-aliases/StoreSpec.md).

#### Parameters

##### spec

[`StoreSpec`](../type-aliases/StoreSpec.md)\<`R`, `S`, `EM`\>

Store configuration (name, reducers, middleware, optional effects).

#### Returns

`Store`\<`EM`, `R`, `S`\>

## Properties

### name

> **name**: `string`

Defined in: [store/Store.ts:320](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L320)

Store name (used by DevTools & diagnostics).

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`name`](../interfaces/StoreInstance.md#name)

## Accessors

### isReplaying

#### Get Signature

> **get** **isReplaying**(): `boolean`

Defined in: [store/Store.ts:2891](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2891)

`true` while devtools is applying a snapshot or replaying events.

##### Remarks

For anything that must branch rather than simply skip. Most code needs nothing: replay
does not notify event subscribers unless they opted in.

A getter, so destructuring it takes a snapshot rather than a live view.

##### Returns

`boolean`

`true` while devtools is applying a snapshot or replaying events.

#### Remarks

For anything that must branch rather than simply skip. Most code needs nothing: replay
does not notify event subscribers unless they opted in.

A getter, so destructuring it takes a snapshot rather than a live view.

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`isReplaying`](../interfaces/StoreInstance.md#isreplaying)

***

### signal

#### Get Signature

> **get** **signal**(): `AbortSignal`

Defined in: [store/Store.ts:753](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L753)

Aborted when the store is disposed.

##### Remarks

Tie anything that should live exactly as long as the store to it: a fetch, a socket, a
listener on something the store does not own. Created on first read, so a store nobody
asks has no `AbortController` at all; read after disposal, it is already aborted. It aborts
last in [dispose](#dispose), after every registry is cleared.

##### Returns

`AbortSignal`

Aborted when the store is disposed. Created on first read; already aborted when read after
disposal. Tie work that should live exactly as long as the store to it.

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`signal`](../interfaces/StoreInstance.md#signal)

## Methods

### \_\_devtoolsIntrospect()

> **\_\_devtoolsIntrospect**(): `object`

Defined in: [store/Store.ts:1640](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L1640)

Returns a structured introspection snapshot for DevTools UIs.

#### Returns

`object`

##### atomic

> **atomic**: `object`[]

##### coarse

> **coarse**: `number`

##### dedupHits

> **dedupHits**: `number`

##### effects

> **effects**: `object`[]

##### event

> **event**: `object`[]

##### middleware

> **middleware**: `object`[]

##### queueDepth

> **queueDepth**: `number`

##### reducers

> **reducers**: `object`[]

#### Remarks

Reads the internal middleware, effects, reducers, and subscriber
registries and returns a plain-object summary matching the
`STORE_SUBSCRIPTIONS` protocol message shape.

#### Implementation of

`StoreInstance.__devtoolsIntrospect`

***

### call()

> **call**\<`C`, `T`\>(`channel`, `type`, `payload`, `opts`): [`CallHandle`](../interfaces/CallHandle.md)\<[`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>, [`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>\>

Defined in: [store/Store.ts:3405](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3405)

Sends a request and waits for the reply, correlating the two automatically.

#### Type Parameters

##### C

`C` *extends* `string`

Request channel.

##### T

`T` *extends* `string`

Request type within `C`.

#### Parameters

##### channel

`C`

Channel to send on.

##### type

`T`

Event type to send.

##### payload

`EM`\[`C`\]\[`T`\]

The **request** payload. This is what you are sending; what comes back is
described by [CallOptions.reply](../interfaces/CallOptions.md#reply), not by this.

##### opts

[`CallOptions`](../interfaces/CallOptions.md)\<`EM`\>

Which replies end the call, and how long to wait. See [CallOptions](../interfaces/CallOptions.md).

#### Returns

[`CallHandle`](../interfaces/CallHandle.md)\<[`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>, [`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>\>

A [CallHandle](../interfaces/CallHandle.md): `await` it for the terminal reply, or `for await` it for
progress events as they arrive.

#### Remarks

Every consumer of an event bus eventually writes request/reply by hand — mint an id,
subscribe, match, time out, unsubscribe — and every one of them writes the same eighty lines
with the same two bugs: the subscription outlives the call, and a responder that forgets to
echo the id produces a timeout with nothing to point at. This is that, once.

**Correlation is structural.** The store stamps `parentId` on anything emitted while an event
is being handled, so a responder that replies through the `emit` it was handed is already
correlated. There is no id to mint, echo, or forget:

```ts
store.registerEffect({
  when: { keys: [["rpc", "ask"]] },
  effect: async (event, _get, emit) => {
    await emit("rpc", "answer", await lookup(event.payload.q));
  },
});
```

The match tests the **immediate** parent, not descent: a reply emitted a further hop down a
cascade carries the intermediate event's id and will not be seen. A responder that cannot
reply directly — because it answers later, on another turn, or across a transport — echoes
[CallOptions.correlationId](../interfaces/CallOptions.md#correlationid) instead, which widens the match by default and replaces it
under `correlation: "id"` (see [CallOptions.correlation](../interfaces/CallOptions.md#correlation)).

**The reply carries its own discriminant.** A call resolves to the *event*, not the payload,
because a caller often cannot know which kind of reply it will get:

```ts
const res = await store.call("rpc", "ask", { q }, { reply: ["rpc", ["answer", "error"]] });
switch (res.type) {
  case "answer": return res.payload;
  case "error":  throw new Error(res.payload.reason);
}
```

**Progress streams, with backpressure.** Any correlated event that is not terminal is
progress, and iterating the call consumes it. The producer genuinely waits: `emit` resolves
only once its effects have run, and the collector is an effect that does not return until the
consumer has taken the item. A responder writing `await emit("rpc", "progress", chunk)` is
therefore paced by the reader, with nothing buffering without bound.

```ts
const call = store.call("job", "start", { id }, {
  reply: ["job", "done"],
  highWaterMark: 4,
});
for await (const step of call) await render(step.payload); // producer waits on this
const { payload } = await call;
```

Backpressure engages **once you begin iterating**. A call that is only awaited never pulls,
so blocking its producer would deadlock the call itself — progress nobody reads would stop
the terminal event from ever being sent. Un-iterated progress therefore buffers to
`highWaterMark` and is then counted on [CallHandle.dropped](../interfaces/CallHandle.md#dropped) rather than blocking.

**This is a local primitive.**

#### Examples

```ts
// Survives a job that streams for minutes; fails a responder that goes quiet for 5s.
await store.call("job", "start", { id }, { reply: ["job", "done"], timeoutMs: 5_000 });
```

```ts
const call = store.call("rpc", "ask", { q }, { reply: ["rpc", "answer"] });
useEffect(() => () => call.cancel("unmounted"), [call]);
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`call`](../interfaces/StoreInstance.md#call)

***

### connect()

> **connect**(`spec`, `h`, `options?`): () => `void`

Defined in: [store/Store.ts:2599](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2599)

Connects a **fine-grained** listener to a dotted path under a slice.

#### Parameters

##### spec

`{ reducer, property }` where `property` is a dotted path (e.g., `"items.0.title"`).
       Supports wildcards: `*` (one segment) and `**` (zero or more segments).

###### property

`string`

###### reducer

`R`

##### h

(`chg`) => `void`

Handler receiving a [Change](../interfaces/Change.md) with `{ oldValue, newValue, path }`.

##### options?

[`ConnectOptions`](../interfaces/ConnectOptions.md)

#### Returns

Unsubscribe function.

> (): `void`

##### Returns

`void`

#### Examples

```ts
const off = store.connect(
  { reducer: 'todos', property: 'items.0.title' },
  (chg) => console.log('title changed:', chg.newValue)
);
off();
```

```ts
// Listen to any item title change
const off = store.connect(
  { reducer: 'todos', property: 'items.*.title' },
  (chg) => console.log('some title changed')
);
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`connect`](../interfaces/StoreInstance.md#connect)

***

### dispose()

> **dispose**(): `void`

Defined in: [store/Store.ts:1018](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L1018)

Releases the store: its timers, subscriptions, observers and registrations.

#### Returns

`void`

#### Remarks

Afterwards the store is inert. `emit()` resolves `{ committed: false }` without running
anything, `call()` rejects with `CallAbortedError`, as does every call still pending, and the
`register*`, `with*` and `replace*` methods throw. Development builds warn once per method
about an `emit` or a `call` that arrives late. [signal](#signal) aborts last. Calling `dispose()`
again does nothing.

#### Example

```ts
const store = createStore({ ... });
// later
store.dispose();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`dispose`](../interfaces/StoreInstance.md#dispose)

***

### emit()

> **emit**\<`C`, `T`\>(`channel`, `type`, `payload`, `opts?`): `Promise`\<[`EmitResult`](../interfaces/EmitResult.md)\>

Defined in: [store/Store.ts:2021](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2021)

Emits a typed event `(channel, type, payload)`.
Events are queued and processed **sequentially** (FIFO).

**Pipeline per event:** the *reduce phase* (steps 1-4) runs **synchronously**,
so `getState()` reflects the change as soon as `emit()` returns; the *effect
phase* (step 5) runs afterwards, asynchronously.
1. **Deduplication** (opt-in) - Skip when content-dedup is enabled (`dedupWindowMs > 0`) or a matching `dedupKey` recurs; off by default
2. **Middleware** (sync) - Pre-reducer hooks; may cancel by returning `false`
3. **Reducers** (sync) - every matching slice is *staged*; nothing is written yet, so a refusal from the last reducer still stops the first one's write
4. **Commit + subscribers** (sync) - all staged slices are assigned under one new root, then event subscribers (`committed`, then `written` when state actually changed), then coarse listeners
5. **Effects** (async) - side-effects keyed by `(channel, type)`; the returned promise resolves once they complete

**Change Detection**: Uses reference equality (`===`) on `this.state` to determine
if any slice changed. Works because the commit builds a new state reference via
shallow spread when any slice changes.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key in `EM`.

##### T

`T` *extends* `string`

Type key within channel `C`.

#### Parameters

##### channel

`C`

Channel name.

##### type

`T`

Event type name.

##### payload

`EM`\[`C`\]\[`T`\]

Payload typed as `EM[C][T]`.

##### opts?

[`EmitOptions`](../interfaces/EmitOptions.md)

Optional per-emit options (e.g. `dedupKey` for identity-based dedup).

#### Returns

`Promise`\<[`EmitResult`](../interfaces/EmitResult.md)\>

A promise that resolves once this event's effects have finished.
State is already updated synchronously before `emit()` returns.

#### Examples

```ts
await store.emit('ui', 'increment', 1);
```

```ts
store.registerMiddleware((state, event) => {
  if (event.type === 'dangerous') return false; // cancel
  return true; // allow
});

await store.emit('ui', 'dangerous', null); // cancelled, no state change
```

#### Implementation of

`StoreInstance.emit`

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Defined in: [store/Store.ts:3022](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3022)

Returns the current immutable state snapshot.

#### Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Deep-readonly state object.

#### Example

```ts
const state = store.getState();
console.log(state.counter.value);
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`getState`](../interfaces/StoreInstance.md#getstate)

***

### hotReplace()

> **hotReplace**(`partial`): `void`

Defined in: [store/Store.ts:3871](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3871)

Convenience API to replace **any subset** of store parts (HMR patterns).

#### Parameters

##### partial

Partial replacement set.

###### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### middleware?

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### preserveState?

`boolean`

###### reducer?

[`ReducerReplacement`](../type-aliases/ReducerReplacement.md)\<`R`, `S`, `EM`\>

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

#### Example

```ts
store.hotReplace({
  reducer: newReducers,
  middleware: newMiddleware,
  effects: newEffects,
  preserveState: true
});
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`hotReplace`](../interfaces/StoreInstance.md#hotreplace)

***

### instrument()

> **instrument**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:2479](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2479)

Registers an instrumentation observer. See [StoreInstance.instrument](../interfaces/StoreInstance.md#instrument).

#### Parameters

##### observer

[`InstrumentationObserver`](../type-aliases/InstrumentationObserver.md)\<`EM`\>

##### options?

[`InstrumentOptions`](../interfaces/InstrumentOptions.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`instrument`](../interfaces/StoreInstance.md#instrument)

***

### onDiagnostic()

> **onDiagnostic**(`observer`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:2467](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2467)

Observes the store's diagnostics. See [StoreInstance.onDiagnostic](../interfaces/StoreInstance.md#ondiagnostic).

#### Parameters

##### observer

[`DiagnosticSink`](../type-aliases/DiagnosticSink.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`onDiagnostic`](../interfaces/StoreInstance.md#ondiagnostic)

***

### onEffect()

> **onEffect**\<`C`, `T`\>(`channel`, `type`, `handler`): () => `void`

Defined in: [store/Store.ts:3556](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3556)

Convenience helper to register an **effect** filtered by a single `(channel, type)` pair.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key within `EM`.

##### T

`T` *extends* `string`

Event type key within channel `C`.

#### Parameters

##### channel

`C`

Channel to filter.

##### type

`T`

Event type to filter.

##### handler

(`payload`, `getState`, `emit`, `event`, `ctx`) => `void` \| `Promise`\<`void`\>

Effect handler `(payload, getState, emit, event)`.

#### Returns

Unsubscribe/teardown function.

> (): `void`

##### Returns

`void`

#### Example

```ts
const off = store.onEffect('ui', 'increment', async (n, get, emit) => {
  if (n > 10) await emit('ui', 'increment', -10);
});
// later
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`onEffect`](../interfaces/StoreInstance.md#oneffect)

***

### onEvent()

> **onEvent**\<`C`, `T`\>(`channel`, `type`, `handler`, `phase`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:2948](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2948)

Subscribe to events by channel and type.

Event subscriptions are intended for the View layer (e.g., React components)
to react to events without affecting the event flow. They are fire-and-forget
and cannot cancel event propagation.

**Phases:**
- `'committed'` (default): Events that passed middleware and reached reducers.
  Notified after reducers, before effects.
- `'uncommitted'`: Events rejected by middleware. Notified immediately after rejection.
- `'written'`: Events that actually changed state. Stricter than `committed`, which
  fires for every event a store accepts including one with no reducers at all.
- `'all'`: Both committed and uncommitted events. Handler receives the phase parameter
  to distinguish between the two. Deliberately not `written` as well: an event that
  writes is also committed, so folding it in would notify every existing `all`
  subscriber twice for one event.

**Replay:** a handler is not called while devtools is replaying, unless it opted in with
`{ duringReplay: true }`.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key within `EM`.

##### T

`T` *extends* `string`

Event type key within channel `C`.

#### Parameters

##### channel

`C`

Channel to subscribe to.

##### type

`T`

Event type to subscribe to.

##### handler

[`NarrowedEventHandler`](../type-aliases/NarrowedEventHandler.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`, `C`, `T`\>

Handler function `(event, getState, emit, phase)`.

##### phase

[`EventPhase`](../type-aliases/EventPhase.md) = `"committed"`

Event phase to subscribe to (default: `'committed'`).

##### options?

###### duringReplay?

`boolean`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

#### Examples

```ts
const off = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Save committed:', event.payload);
});
off();
```

```ts
store.onEvent('ui', 'delete', (event, getState, emit, phase) => {
  console.log('Delete was rejected by middleware');
}, 'uncommitted');
```

```ts
store.onEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log('Action:', phase); // 'committed' or 'uncommitted'
}, 'all');
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`onEvent`](../interfaces/StoreInstance.md#onevent)

***

### onRegistrationChange()

> **onRegistrationChange**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:2668](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L2668)

Subscribe to reducer, middleware and effect registrations.

Delivered as an array, one batch per public call: `replaceReducers` unmounts and then
remounts, and a per-change observer would see a spurious unmount of a slice that is only
being updated. Observers run after the state broadcast, and a registration made by an
observer is queued rather than delivered re-entrantly.

Replay never produces a change, so there is no `duringReplay` option here. `dispose()`
fires nothing.

#### Parameters

##### observer

[`RegistrationObserver`](../type-aliases/RegistrationObserver.md)\<`EM`\>

Receives one batch per registration change.

##### options?

`emitCurrent` synthesizes a `'mounted'` batch for everything already
installed, delivered synchronously before this call returns, carrying each registration's
real origin rather than a synthetic marker.

###### emitCurrent?

`boolean`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

#### Example

```ts
const off = store.onRegistrationChange((changes) => {
  for (const c of changes) {
    console.log(c.op, c.kind, c.name, c.origin);
  }
}, { emitCurrent: true });
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`onRegistrationChange`](../interfaces/StoreInstance.md#onregistrationchange)

***

### registerEffect()

> **registerEffect**(`spec`): `any`

Defined in: [store/Store.ts:3431](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3431)

Register a post-reducer effect (sees final state). Returns an unsubscribe.

#### Parameters

##### spec

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

#### Returns

`any`

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerEffect`](../interfaces/StoreInstance.md#registereffect)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): `any`

Defined in: [store/Store.ts:3060](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3060)

Registers a middleware (runs **before** reducers).

#### Parameters

##### mw

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<`any`, `any`\>

Middleware `(state, event, emit) => boolean`. Return `false` to cancel event
       propagation.

#### Returns

`any`

Unsubscribe function that removes this middleware.

#### Remarks

**Synchronous, and that is the contract.** The reduce phase completes before `emit()`
returns, so the commit decision has to be available in the same tick. An `async` middleware
returns a Promise, every Promise is truthy, and the veto would therefore never fire — the
event would commit while the middleware was still deciding. The type rejects it; this note
exists because the examples here used to teach it. Do authorization and validation here, and
anything that needs to await in an effect.

#### Examples

```ts
const off = store.registerMiddleware((state, event) => {
  console.log('Event:', event.channel, event.type, event.payload);
  return true; // allow
});
off();
```

```ts
store.registerMiddleware((state, event) => {
  if (event.type === 'forbidden') return false; // cancel
  return true;
});
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerMiddleware`](../interfaces/StoreInstance.md#registermiddleware)

***

### registerReducer()

> **registerReducer**(`name`, `spec`, `options?`): `any`

Defined in: [store/Store.ts:3193](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3193)

Dynamically **adds** a named slice reducer at runtime.

#### Parameters

##### name

`string`

New slice name (must not already exist).

##### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `any`\>

Reducer spec (state, when, reducer).

##### options?

###### owner?

`string`

#### Returns

`any`

Disposer function that **removes** the slice (and its state).

#### Example

```ts
const dispose = store.registerReducer('filters', {
  state: { q: '' },
  events: [['ui', 'setQuery']],
  reducer(s, evt) {
    return evt.type === 'setQuery' ? { q: evt.payload } : s;
  }
});
// Later:
dispose();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerReducer`](../interfaces/StoreInstance.md#registerreducer)

***

### registerSlice()

> **registerSlice**(`name`, `spec`, `options?`): `any`

Defined in: [store/Store.ts:3206](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3206)

Mounts a slice and hands back the widened store alongside a disposer.

#### Parameters

##### name

`string`

##### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `any`\>

##### options?

###### owner?

`string`

#### Returns

`any`

#### Remarks

The name `registerSlice` is what the guide uses; `registerReducer` keeps its broader
`name: string` signature and delegates here, so existing call sites are untouched.

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerSlice`](../interfaces/StoreInstance.md#registerslice)

***

### replaceEffects()

> **replaceEffects**(`next`, `opts`): `void`

Defined in: [store/Store.ts:3655](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3655)

Replaces all registered **effects** (HMR-friendly).

#### Parameters

##### next

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New effects array (as EffectSpecs).

##### opts

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

#### Example

```ts
if (import.meta.hot) {
  import.meta.hot.accept('./effects', (newModule) => {
    store.replaceEffects(newModule.effects);
  });
}
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`replaceEffects`](../interfaces/StoreInstance.md#replaceeffects)

***

### replaceMiddleware()

> **replaceMiddleware**(`next`, `opts`): `void`

Defined in: [store/Store.ts:3599](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3599)

Replaces the **entire** middleware pipeline (HMR-friendly).

#### Parameters

##### next

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New middleware array.

##### opts

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

#### Example

```ts
if (import.meta.hot) {
  import.meta.hot.accept('./middleware', (newModule) => {
    store.replaceMiddleware(newModule.middleware);
  });
}
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`replaceMiddleware`](../interfaces/StoreInstance.md#replacemiddleware)

***

### replaceReducers()

> **replaceReducers**(`next`, `opts`): `void`

Defined in: [store/Store.ts:3738](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3738)

Replaces the entire **reducer set** (HMR-friendly).

#### Parameters

##### next

[`ReducerReplacement`](../type-aliases/ReducerReplacement.md)\<`R`, `S`, `EM`\>

Map of slice specs keyed by slice name.

##### opts

`{ preserveState?: boolean }` (default `true`) and
`{ scope?: "spec" | "all" }` (default `"spec"`).

###### preserveState?

`boolean`

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

#### Remarks

Replaces **spec-provenance slices only**. A slice mounted after construction with
`registerSlice` survives, along with its state: it was never part of the set this call
is replacing. Pass `{ scope: "all" }` for the pre-0.8.0 wholesale behaviour.

Throws, before mutating anything, if `next` names a slice a library mounted at runtime.

#### Example

```ts
if (import.meta.hot) {
  import.meta.hot.accept('./reducers', (newModule) => {
    store.replaceReducers(newModule.reducers, { preserveState: true });
  });
}
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`replaceReducers`](../interfaces/StoreInstance.md#replacereducers)

***

### subscribe()

> **subscribe**(`fn`): () => `void`

Defined in: [store/Store.ts:3004](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3004)

Subscribes to **coarse-grained** commits (called once per successful event, only if state changed).

**Use Case**: React's `useSyncExternalStore` or similar external store integrations.

#### Parameters

##### fn

() => `void`

Listener invoked after reducers/effects have run and state has changed.

#### Returns

Unsubscribe function.

> (): `void`

##### Returns

`void`

#### Example

```ts
const off = store.subscribe(() => console.log('state committed'));
// Later:
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`subscribe`](../interfaces/StoreInstance.md#subscribe)

***

### withEffect()

> **withEffect**(`spec`): `any`

Defined in: [store/Store.ts:3283](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3283)

Registers an effect and returns the widened store, for chaining.

#### Parameters

##### spec

[`EffectSpec`](../interfaces/EffectSpec.md)\<`any`, `any`\>

#### Returns

`any`

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`withEffect`](../interfaces/StoreInstance.md#witheffect)

***

### withMiddleware()

> **withMiddleware**(`mw`): `any`

Defined in: [store/Store.ts:3273](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3273)

Registers middleware and returns the widened store, for chaining.

#### Parameters

##### mw

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<`any`, `any`\>

#### Returns

`any`

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`withMiddleware`](../interfaces/StoreInstance.md#withmiddleware)

***

### withSlice()

> **withSlice**(`name`, `spec`, `options?`): `any`

Defined in: [store/Store.ts:3263](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L3263)

Mounts a slice and returns the widened store, for chaining.

#### Parameters

##### name

`string`

##### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `any`\>

##### options?

###### owner?

`string`

#### Returns

`any`

#### Remarks

No disposer, deliberately. After a disposer runs, the widened type still promises a
slice that is gone, and TypeScript cannot express "valid until that call". The chaining
API therefore does not hand one out, so the footgun does not exist on the path most
people take; [registerSlice](#registerslice) carries one for the library that owns the slice, and
the documented rule is that a disposer stays library-private.

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`withSlice`](../interfaces/StoreInstance.md#withslice)

***

### buildAncestorPaths()

> `static` **buildAncestorPaths**(`path`): `string`[]

Defined in: [store/Store.ts:4190](https://github.com/yoltra/yoltra/blob/main/packages/core/src/store/Store.ts#L4190)

Builds ancestor paths for a dotted path.

For `"a.b.c"`, returns `["a", "a.b", "a.b.c"]`. Leading dots are trimmed.

#### Parameters

##### path

`string`

Dotted path string.

#### Returns

`string`[]

Array of ancestor paths.

#### Example

```ts
Store.buildAncestorPaths('x.y.z'); // ['x','x.y','x.y.z']
```
