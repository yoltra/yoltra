[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / Store

# Class: Store\<EM, R, S\>

Defined in: [store/Store.ts:76](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L76)

Public Store surface.

## Remarks

The concrete Store implements this as `StoreInstance<R, DeepReadonly<S>, EM>`.

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

Reducer name union.

### R

`R` *extends* `string`

State record (already readonly at the call site).

### S

`S` *extends* `Record`\<`R`, `any`\>

Event map.

## Implements

- [`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

## Constructors

### Constructor

> **new Store**\<`EM`, `R`, `S`\>(`spec`): `Store`\<`EM`, `R`, `S`\>

Defined in: [store/Store.ts:321](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L321)

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

Defined in: [store/Store.ts:83](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L83)

Store name (used by DevTools & diagnostics).

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`name`](../interfaces/StoreInstance.md#name)

## Methods

### \_\_devtoolsIntrospect()

> **\_\_devtoolsIntrospect**(): `object`

Defined in: [store/Store.ts:789](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L789)

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

### connect()

> **connect**(`spec`, `h`): () => `void`

Defined in: [store/Store.ts:1322](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1322)

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

Defined in: [store/Store.ts:405](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L405)

Cleanup resources (timers, etc.) when disposing the store.
Call this if you're dynamically creating/destroying stores.

#### Returns

`void`

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

> **emit**\<`C`, `T`\>(`channel`, `type`, `payload`, `opts?`): `Promise`\<`void`\>

Defined in: [store/Store.ts:1063](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1063)

Emits a typed event `(channel, type, payload)`.
Events are queued and processed **sequentially** (FIFO).

**Pipeline per event:** the *reduce phase* (steps 1-4) runs **synchronously**,
so `getState()` reflects the change as soon as `emit()` returns; the *effect
phase* (step 5) runs afterwards, asynchronously.
1. **Deduplication** (opt-in) - Skip when content-dedup is enabled (`dedupWindowMs > 0`) or a matching `dedupKey` recurs; off by default
2. **Middleware** (sync) - Pre-reducer hooks; may cancel by returning `false`
3. **Reducers** (sync) - state updates + fine-grained path notifications
4. **Subscribers + coarse** (sync) - event subscribers (fire-and-forget) then coarse listeners (only if state changed)
5. **Effects** (async) - side-effects keyed by `(channel, type)`; the returned promise resolves once they complete

**Change Detection**: Uses reference equality (`===`) on `this.state` to determine
if any slice changed. Works because forwardEvent creates a new state reference
via shallow spread when any slice changes.

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

`Promise`\<`void`\>

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

Defined in: [store/Store.ts:1437](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1437)

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

Defined in: [store/Store.ts:1767](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1767)

Convenience API to replace **any subset** of store parts (HMR patterns).

#### Parameters

##### partial

Partial replacement set.

###### effects?

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### preserveState?

`boolean`

###### reducer?

`Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

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

> **instrument**(`observer`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:1244](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1244)

Registers an instrumentation observer. See [StoreInstance.instrument](../interfaces/StoreInstance.md#instrument).

#### Parameters

##### observer

[`InstrumentationObserver`](../type-aliases/InstrumentationObserver.md)\<`EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`instrument`](../interfaces/StoreInstance.md#instrument)

***

### onEffect()

> **onEffect**\<`C`, `T`\>(`channel`, `type`, `handler`): () => `void`

Defined in: [store/Store.ts:1633](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1633)

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

(`payload`, `getState`, `emit`, `event`) => `void` \| `Promise`\<`void`\>

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

> **onEvent**\<`C`, `T`\>(`channel`, `type`, `handler`, `phase`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:1372](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1372)

Subscribe to events by channel and type.

Event subscriptions are intended for the View layer (e.g., React components)
to react to events without affecting the event flow. They are fire-and-forget
and cannot cancel event propagation.

**Phases:**
- `'committed'` (default): Events that passed middleware and reached reducers.
  Notified after reducers, before effects.
- `'uncommitted'`: Events rejected by middleware. Notified immediately after rejection.
- `'all'`: Both committed and uncommitted events. Handler receives the phase parameter
  to distinguish between the two.

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

### registerEffect()

> **registerEffect**(`spec`): () => `void`

Defined in: [store/Store.ts:1545](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1545)

Registers an **effect** (stateless async event consumer) that runs after reducers.

Effects are **keyed** by `(channel, type)` for O(1) lookup (no scanning all effects).

#### Parameters

##### spec

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

Effect specification with `events` (EventKeys) and `effect` (handler).

#### Returns

Unsubscribe function.

> (): `void`

##### Returns

`void`

#### Examples

```ts
const off = store.registerEffect({
  events: [['ui', 'increment']],
  effect: async (evt, getState, emit) => {
    console.log('increment', evt.payload, getState().counter.value);
  }
});
off();
```

```ts
store.registerEffect({
  events: [['ui', 'increment'], ['ui', 'decrement']],
  effect: async (evt, getState, emit) => {
    // Runs for both increment and decrement
    await saveToServer(getState());
  }
});
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerEffect`](../interfaces/StoreInstance.md#registereffect)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:1467](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1467)

Registers a middleware (runs **before** reducers).

#### Parameters

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

Middleware `(state, event, emit) => boolean|Promise<boolean>`.
       Return `false` to cancel event propagation.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function that removes this middleware.

#### Examples

```ts
const off = store.registerMiddleware(async (state, event) => {
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

> **registerReducer**(`name`, `spec`): () => `void`

Defined in: [store/Store.ts:1497](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1497)

Dynamically **adds** a named slice reducer at runtime.

#### Parameters

##### name

`string`

New slice name (must not already exist).

##### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `EM`\>

Reducer spec (state, events, reducer).

#### Returns

Disposer function that **removes** the slice (and its state).

> (): `void`

##### Returns

`void`

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

### replaceEffects()

> **replaceEffects**(`next`): `void`

Defined in: [store/Store.ts:1696](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1696)

Replaces all registered **effects** (HMR-friendly).

#### Parameters

##### next

[`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New effects array (as EffectSpecs).

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

> **replaceMiddleware**(`next`): `void`

Defined in: [store/Store.ts:1675](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1675)

Replaces the **entire** middleware pipeline (HMR-friendly).

#### Parameters

##### next

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New middleware array.

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

Defined in: [store/Store.ts:1721](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1721)

Replaces the entire **reducer set** (HMR-friendly).

#### Parameters

##### next

`Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Map of slice specs keyed by slice name.

##### opts

`{ preserveState?: boolean }` (default `true`).

###### preserveState?

`boolean`

#### Returns

`void`

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

Defined in: [store/Store.ts:1419](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1419)

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

### buildAncestorPaths()

> `static` **buildAncestorPaths**(`path`): `string`[]

Defined in: [store/Store.ts:1972](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/core/src/store/Store.ts#L1972)

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
