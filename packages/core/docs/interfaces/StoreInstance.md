![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreInstance

# Interface: StoreInstance\<R, S, EM\>

Defined in: [types.ts:1049](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1049)

Public Store surface.

## Remarks

The concrete Store implements this as `StoreInstance<R, DeepReadonly<S>, EM>`.

## Extends

- [`StoreDecoration`](StoreDecoration.md)\<`R`, `S`, `EM`\>

## Type Parameters

### R

`R` *extends* `string` = `string`

Reducer name union.

### S

`S` *extends* `Record`\<`R`, `any`\> = `Record`\<`string`, `any`\>

State record (already readonly at the call site).

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### emit

> **emit**: [`Emit`](../type-aliases/Emit.md)\<`EM`\>

Defined in: [types.ts:1068](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1068)

Emit a typed event `(channel, type, payload)`.
Returns a promise that resolves when the event has been processed.

***

### isReplaying

> `readonly` **isReplaying**: `boolean`

Defined in: [types.ts:1308](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1308)

`true` while devtools is applying a snapshot or replaying events.

#### Remarks

For anything that must branch rather than simply skip. Most code needs nothing: replay
does not notify event subscribers unless they opted in.

A getter, so destructuring it takes a snapshot rather than a live view.

***

### name

> **name**: `string`

Defined in: [types.ts:1057](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1057)

Store name (used by DevTools to identify the instance).

***

### signal

> `readonly` **signal**: `AbortSignal`

Defined in: [types.ts:1194](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1194)

Aborted when the store is disposed. Created on first read; already aborted when read after
disposal. Tie work that should live exactly as long as the store to it.

## Methods

### call()

> **call**\<`C`, `T`\>(`channel`, `type`, `payload`, `opts`): [`CallHandle`](CallHandle.md)\<[`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>, [`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>\>

Defined in: [types.ts:1097](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1097)

Sends a request and waits for the reply, correlating the two automatically.

#### Type Parameters

##### C

`C` *extends* `string`

##### T

`T` *extends* `string`

#### Parameters

##### channel

`C`

##### type

`T`

##### payload

`EM`\[`C`\]\[`T`\]

##### opts

[`CallOptions`](CallOptions.md)\<`EM`\>

#### Returns

[`CallHandle`](CallHandle.md)\<[`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>, [`EventUnion`](../type-aliases/EventUnion.md)\<`EM`\>\>

#### Remarks

Awaitable for the terminal reply, async-iterable for progress. See the implementation on
[Store.call](../classes/Store.md#call) for the full contract: correlation, backpressure, timeouts, and why it
is a local primitive.

***

### connect()

> **connect**(`spec`, `handler`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1083](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1083)

Fine-grained subscription: listen to a specific `reducer.property` path.
Accepts a dotted path string (e.g., "data.123.title").
Fires when that path (or its ancestors) actually changes.

#### Parameters

##### spec

`{ reducer, property }` where `property` is a single dotted path string.

###### property

`string`

###### reducer

`R`

##### handler

(`change`) => `void`

Handler receiving a [Change](Change.md) with `{ oldValue, newValue, path }`.

##### options?

[`ConnectOptions`](ConnectOptions.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### dispose()

> **dispose**(): `void`

Defined in: [types.ts:1169](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1169)

Releases the store. Afterwards it is inert: `emit()` resolves `{ committed: false }` without
running anything, `call()` rejects with `CallAbortedError` (as does every pending call), and
registration methods throw. [StoreInstance.signal](#signal) aborts last. Idempotent.

#### Returns

`void`

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Defined in: [types.ts:1062](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1062)

Read the full state (already readonly).

#### Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

***

### hotReplace()

> **hotReplace**(`partial`): `void`

Defined in: [types.ts:1348](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1348)

Convenience API to replace any subset of store parts (HMR patterns).

#### Parameters

##### partial

Partial replacement set.

###### effects?

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

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

***

### instrument()

> **instrument**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1419](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1419)

Registers an instrumentation observer, called once per emitted event
(committed or vetoed) after the synchronous reduce phase, with the exact
changed paths, their old/new values, and reduce timing. This is the typed
seam DevTools agents consume — no `as any` bridging required.

#### Parameters

##### observer

[`InstrumentationObserver`](../type-aliases/InstrumentationObserver.md)\<`EM`\>

Receives an [InstrumentedEvent](InstrumentedEvent.md) per emit.

##### options?

[`InstrumentOptions`](InstrumentOptions.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

***

### instrumentEffects()

> **instrumentEffects**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1436](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1436)

Observes the effect phase: once every effect for an event has settled, reports how long each
took, whether it failed, and what it is called.

#### Parameters

##### observer

[`EffectsObserver`](../type-aliases/EffectsObserver.md)\<`EM`\>

Called once per event whose effects ran.

##### options?

[`InstrumentOptions`](InstrumentOptions.md)

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

#### Remarks

[StoreInstance.instrument](#instrument) reports an event after its reducers ran, before its
effects. This is the other half, for tracing and timing: effect spans, slow handlers, failure
rates by effect. Called only for an event whose effects ran at least one effect, and only
while an observer is registered is any timing taken. Events on an ephemeral channel reach it
only with `{ ephemeral: true }`, as with `instrument`. An observer that throws is reported
as `observer-error` and does not affect the store.

***

### metrics()

> **metrics**(): [`StoreMetrics`](StoreMetrics.md)

Defined in: [types.ts:1175](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1175)

The store's current load: queue depth, effects in flight, deduplication. Cheap enough to read
on every scrape of a metrics endpoint.

#### Returns

[`StoreMetrics`](StoreMetrics.md)

***

### onDiagnostic()

> **onDiagnostic**(`observer`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1451](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1451)

Observes the store's diagnostics: the failures it contained, its refusals and its
development warnings, as [Diagnostic](Diagnostic.md)s.

#### Parameters

##### observer

[`DiagnosticSink`](../type-aliases/DiagnosticSink.md)

Called once per diagnostic.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

#### Remarks

For code attached to a store it did not create, such as a library that decorates one, which
cannot set [StoreSpec.diagnostics](../type-aliases/StoreSpec.md#diagnostics) or the `on*` hooks. An observer is additive: it
does not silence the console output a store without a sink produces, and it receives what a
sink receives. One that throws is ignored.

***

### onEffect()

> **onEffect**\<`C`, `T`\>(`channel`, `type`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1115](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1115)

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

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe/teardown function.

***

### onEvent()

> **onEvent**\<`C`, `T`\>(`channel`, `type`, `handler`, `phase?`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1240](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1240)

Subscribe to events by channel and type.

Event subscriptions are intended for the View layer (e.g., React components)
to react to events without affecting the event flow. They are fire-and-forget
and cannot cancel event propagation.

**Phases:**
- `'committed'` (default): Events that passed middleware and reached reducers
- `'uncommitted'`: Events rejected by middleware
- `'written'`: Events that actually changed state
- `'all'`: Both committed and uncommitted events (handler receives phase parameter).
  Deliberately not `written` as well: an event that writes is also committed, so folding
  it in would notify every existing `all` subscriber twice for one event.

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

##### phase?

[`EventPhase`](../type-aliases/EventPhase.md)

Event phase to subscribe to (default: `'committed'`).

##### options?

###### duringReplay?

`boolean`

Also call this handler while devtools is replaying, which it does not by default.

**Remarks**

Opt in only for a handler that derives view state purely from the event stream and
performs no I/O. A handler that publishes, writes or notifies must stay out: replay
is a debugging operation, and a scrub of the timeline should not reach a peer, a
socket or an analytics endpoint.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

#### Examples

```ts
const off = store.onEvent('ui', 'save', (event, getState, emit, phase) => {
  console.log('Save committed:', event.payload);
});
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

***

### onRegistrationChange()

> **onRegistrationChange**(`observer`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1294](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1294)

Called when the store gains or loses a reducer, middleware or effect.

#### Parameters

##### observer

[`RegistrationObserver`](../type-aliases/RegistrationObserver.md)\<`EM`\>

Receives one batch per registration change.

##### options?

`emitCurrent` synthesizes a `"mounted"` batch for everything already
installed, delivered synchronously before this call returns. Spec-time registrations
happen inside `createStore`, so a decorator applied afterwards never saw them arrive;
this closes that gap without a separate pull API to race against. The synthesized
changes carry their **real** origins, never a synthetic marker, because filtering on
provenance is the main thing an observer does.

###### emitCurrent?

`boolean`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

#### Remarks

A push seam, because `__devtoolsIntrospect()` is pull-only: a devtools panel's
subscription list goes stale the moment a decoration mounts anything, and a library that
needs to react to another library has nothing to wait on.

Delivered as an **array, one batch per public call**. `replaceReducers` unmounts and then
remounts, so between those steps a slice that is merely being updated does not exist; a
per-change observer would see a spurious unmount. `hotReplace` delivers a single batch
spanning all three kinds.

Observers run **after** the state broadcast, so the view layer has already been told a
fact before a library gets to react to it. A registration made *by* an observer is
legitimate and is queued rather than delivered re-entrantly: depth-first work,
breadth-first notification, so no observer ever sees a half-built topology.

Synchronous. A `Promise` returned from an observer is not awaited, and is reported in
development, because the store has already moved on by the time it would resolve.

**Replay never produces a change.** `__replayEvents` and `__applyExternalState` alter
state and never topology, so there is no `duringReplay` option here and none is needed.

`dispose()` fires nothing: the store is going away, not being dismantled slice by slice.

***

### registerEffect()

> **registerEffect**\<`Spec`\>(`spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

Defined in: [types.ts:1133](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1133)

Register a post-reducer effect (sees final state). Returns an unsubscribe.

#### Type Parameters

##### Spec

`Spec` *extends* [`EffectSpec`](EffectSpec.md)\<`any`, `any`\>

#### Parameters

##### spec

`Spec`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

***

### registerMiddleware()

> **registerMiddleware**\<`M`\>(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

Defined in: [types.ts:1140](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1140)

Dynamically add middleware, in either the function or the spec form.

#### Type Parameters

##### M

`M` *extends* [`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<`any`, `any`\>

#### Parameters

##### mw

`M`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

***

### registerReducer()

> **registerReducer**\<`N`, `Spec`\>(`name`, `spec`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

Defined in: [types.ts:1158](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1158)

Dynamically add/remove a namespaced reducer slice at runtime.

#### Type Parameters

##### N

`N` *extends* `string`

##### Spec

`Spec` *extends* [`ReducerSpec`](ReducerSpec.md)\<`any`, `any`\>

#### Parameters

##### name

`N`

##### spec

`Spec`

##### options?

###### owner?

`string`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

#### Remarks

Generic over the spec for the same reason [StoreDecoration.registerSlice](StoreDecoration.md#registerslice) is, and it
matters for anyone writing a decorator. Typed as `ReducerSpec<any, EM>` — the store's *own*
event map — a spec naming a channel the application's `EM` does not contain could not
typecheck, and neither direction of assignability held: the forward direction failed on
`reducer`, a property rather than a method, so `strictFunctionTypes` checks its parameters
contravariantly and bivariance does not rescue it; the reverse failed on `when`. A decoration
therefore had to keep a cast. With `Spec` inferred from the value, the concrete key tuple
satisfies `ReducerSpec<any, any>` and the contributed event map is recovered from the brand,
exactly as the `with*` family already did.

***

### registerSlice()

> **registerSlice**\<`N`, `Spec`\>(`name`, `spec`, `options?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

Defined in: [types.ts:2672](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2672)

Mounts a slice and hands back both the widened store and a disposer.

The disposer is **library-private**: after it runs, the widened type still promises a
slice that is gone. Application code should take [StoreDecoration.withSlice](StoreDecoration.md#withslice)
instead, which returns no disposer at all.

#### Type Parameters

##### N

`N` *extends* `string`

##### Spec

`Spec` *extends* [`ReducerSpec`](ReducerSpec.md)\<`any`, `any`\>

#### Parameters

##### name

`N`

##### spec

`Spec`

##### options?

###### owner?

`string`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md) & `object`

#### Inherited from

[`StoreDecoration`](StoreDecoration.md).[`registerSlice`](StoreDecoration.md#registerslice)

***

### replaceEffects()

> **replaceEffects**(`next`, `opts?`): `void`

Defined in: [types.ts:1325](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1325)

Replaces all registered effects (HMR-friendly).

#### Parameters

##### next

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New effects array (as EffectSpecs).

##### opts?

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

***

### replaceMiddleware()

> **replaceMiddleware**(`next`, `opts?`): `void`

Defined in: [types.ts:1315](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1315)

Replaces the entire middleware pipeline (HMR-friendly).

#### Parameters

##### next

[`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New middleware array.

##### opts?

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

***

### replaceReducers()

> **replaceReducers**(`next`, `opts?`): `void`

Defined in: [types.ts:1338](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1338)

Replaces the entire reducer set (HMR-friendly).

#### Parameters

##### next

[`ReducerReplacement`](../type-aliases/ReducerReplacement.md)\<`R`, `S`, `EM`\>

Slice specs keyed by slice name, each typed with its own slice's state. Every
  key is optional: an omitted slice this call owns is removed, and an omitted slice mounted
  at runtime is kept. See [ReducerReplacement](../type-aliases/ReducerReplacement.md).

##### opts?

`{ preserveState?: boolean }` (default `true`).

###### preserveState?

`boolean`

###### scope?

[`ReplaceScope`](../type-aliases/ReplaceScope.md)

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:1073](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1073)

Coarse subscription: runs after any state change (once per committed event).

#### Parameters

##### listener

() => `void`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### whenIdle()

> **whenIdle**(): `Promise`\<`void`\>

Defined in: [types.ts:1188](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1188)

Resolves when the store is idle: no event waiting to be reduced and no effect running.

#### Returns

`Promise`\<`void`\>

#### Remarks

For a graceful shutdown, where a process stops taking new work, waits for what is in
progress, and then disposes. A `call()` waiting for its reply and a pending timer are not
work the store is doing, so they do not delay it. Resolves at once when the store is already
idle or disposed, and every pending wait resolves on dispose. Bound it with a timeout: an
effect that never settles keeps the store busy. Never await it from an effect, which is
itself the work it would wait for.

***

### withEffect()

> **withEffect**\<`Spec`\>(`spec`): [`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`Spec`\>\>\>

Defined in: [types.ts:2697](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2697)

Registers an effect and returns the store widened by whatever event map it declares.

#### Type Parameters

##### Spec

`Spec` *extends* [`EffectSpec`](EffectSpec.md)\<`any`, `any`\>

#### Parameters

##### spec

`Spec`

#### Returns

[`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`Spec`\>\>\>

#### Inherited from

[`StoreDecoration`](StoreDecoration.md).[`withEffect`](StoreDecoration.md#witheffect)

***

### withMiddleware()

> **withMiddleware**\<`M`\>(`mw`): [`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`M`\>\>\>

Defined in: [types.ts:2692](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2692)

Registers middleware and returns the store widened by whatever event map it declares.

Only the **spec form** can widen: `MiddlewareFunction`'s event parameter is
`EventUnion<EM>`, a mapped type TypeScript cannot infer `EM` back out of. A bare function
therefore contributes `{}`.

#### Type Parameters

##### M

`M` *extends* [`MiddlewareInput`](../type-aliases/MiddlewareInput.md)\<`any`, `any`\>

#### Parameters

##### mw

`M`

#### Returns

[`DecoratableStore`](../type-aliases/DecoratableStore.md)\<`R`, `S`, [`Merge`](../type-aliases/Merge.md)\<`EM`, [`EMAddOf`](../type-aliases/EMAddOf.md)\<`M`\>\>\>

#### Inherited from

[`StoreDecoration`](StoreDecoration.md).[`withMiddleware`](StoreDecoration.md#withmiddleware)

***

### withSlice()

> **withSlice**\<`N`, `Spec`\>(`name`, `spec`, `options?`): [`WidenedSlice`](../type-aliases/WidenedSlice.md)\<`R`, `S`, `EM`, `N`, `Spec`\>

Defined in: [types.ts:2679](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L2679)

Mounts a slice and returns the widened store, for chaining.

#### Type Parameters

##### N

`N` *extends* `string`

##### Spec

`Spec` *extends* [`ReducerSpec`](ReducerSpec.md)\<`any`, `any`\>

#### Parameters

##### name

`N`

##### spec

`Spec`

##### options?

###### owner?

`string`

#### Returns

[`WidenedSlice`](../type-aliases/WidenedSlice.md)\<`R`, `S`, `EM`, `N`, `Spec`\>

#### Inherited from

[`StoreDecoration`](StoreDecoration.md).[`withSlice`](StoreDecoration.md#withslice)
