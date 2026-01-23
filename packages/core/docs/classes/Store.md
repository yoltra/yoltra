[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Store

# Class: Store\<EM, R, S\>

Defined in: [store/Store.ts:102](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L102)

Strongly-typed, channel/event-driven **store** with:
- **Slice reducers** (namespaced under `R`)
- **Middleware** (pre-reducer, can cancel propagation)
- **Effects** (post-reducer, async-safe, keyed by EventKey)
- **Granular subscriptions** via dotted **property paths** (e.g., `"todos.3.title"`)
- **Event subscriptions** for even more reactive UI
- **Event deduplication** via unique event IDs (prevents React Strict Mode double-firing)
- Optional **Redux DevTools** integration (dev)

## Remarks

- `emit()` is **serialized** internally: events are queued and processed one-by-one.
- Each event receives a unique `id` (symbol) for deduplication.
- Reducers are wired through an internal [EventBus](EventBus.md) by `(channel, type)`.
- Effects are keyed by `(channel, type)` for O(1) lookup (no scanning).
- Fine-grained change events are emitted through a [LooseEventBus](LooseEventBus.md) by **dotted paths**.
- State is **immutable**: each slice change creates a new state reference (shallow clone).
- State slices are **frozen** (deeply) before committing to discourage mutation.

## Example

```ts
type Counter = { value: number };
type Todos = { items: Array<{ id: string; title: string }> };
type S = { counter: Counter; todos: Todos };
type EM = {
  ui: { increment: number; setTitle: { id: string; title: string } };
};

const store = createStore({
  name: 'Demo',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [['ui', 'increment']],
      reducer(s, evt) {
        if (evt.type === 'increment') return { value: s.value + evt.payload };
        return s;
      }
    },
    todos: {
      state: { items: [] },
      events: [['ui', 'setTitle']],
      reducer(s, evt) {
        if (evt.type === 'setTitle') {
          const next = structuredClone(s);
          const t = next.items.find(x => x.id === evt.payload.id);
          if (t) t.title = evt.payload.title;
          return next;
        }
        return s;
      }
    }
  }
});

// Subscribe to a dotted path
const unsub = store.connect({ reducer: 'todos', property: 'items.0.title' }, (chg) => {
  console.log('title changed from', chg.oldValue, 'to', chg.newValue);
});

// Emit event
await store.emit('ui', 'increment', 1);
```

## Type Parameters

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map describing `(channel → type → payload)` types.

### R

`R` *extends* `string`

Union of slice names (string literal union).

### S

`S` *extends* `Record`\<`R`, `any`\>

Object map of slice states keyed by `R`.

## Implements

- [`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `EM`\>

## Constructors

### Constructor

> **new Store**\<`EM`, `R`, `S`\>(`spec`): `Store`\<`EM`, `R`, `S`\>

Defined in: [store/Store.ts:246](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L246)

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

Defined in: [store/Store.ts:109](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L109)

Store name (used by DevTools & diagnostics).

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`name`](../interfaces/StoreInstance.md#name)

## Methods

### connect()

> **connect**(`spec`, `h`): () => `void`

Defined in: [store/Store.ts:759](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L759)

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

Defined in: [store/Store.ts:395](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L395)

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

> **emit**\<`C`, `T`\>(`channel`, `type`, `payload`): `Promise`\<`void`\>

Defined in: [store/Store.ts:624](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L624)

Emits a typed event `(channel, type, payload)`.
Events are queued and processed **sequentially** (FIFO).

**Pipeline per event:**
1. **Deduplication check** - Skip if event ID already processed (React Strict Mode safety)
2. **Middleware** - Pre-reducer hooks; may cancel by returning `false`
3. **Reducers** - Synchronous state updates via internal event bus
4. **Effects** - Async side-effects keyed by `(channel, type)` for O(1) lookup
5. **Coarse subscribers** - External store subscribers (only if state changed)
6. **DevTools** - Redux DevTools logging (dev only)

**Change Detection**: Uses reference equality (`===`) on `this.state` to determine
if any slice changed. Works because forwardEvent creates a new state reference
via shallow spread when any slice changes.

#### Type Parameters

##### C

`C` *extends* `string` \| `number` \| `symbol`

Channel key in `EM`.

##### T

`T` *extends* `string` \| `number` \| `symbol`

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

#### Returns

`Promise`\<`void`\>

A promise that resolves when the event has finished processing.

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

Defined in: [store/Store.ts:873](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L873)

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

Defined in: [store/Store.ts:1165](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L1165)

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

### onEffect()

> **onEffect**\<`C`, `T`\>(`channel`, `type`, `handler`): () => `void`

Defined in: [store/Store.ts:1030](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L1030)

Convenience helper to register an **effect** filtered by a single `(channel, type)` pair.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key within `EM`.

##### T

`T` *extends* `string` \| `number` \| `symbol`

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

Defined in: [store/Store.ts:809](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L809)

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

`T` *extends* `string` \| `number` \| `symbol`

Event type key within channel `C`.

#### Parameters

##### channel

`C`

Channel to subscribe to.

##### type

`T`

Event type to subscribe to.

##### handler

[`EventSubscriptionHandler`](../type-aliases/EventSubscriptionHandler.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

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

Defined in: [store/Store.ts:981](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L981)

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

Defined in: [store/Store.ts:903](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L903)

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

Defined in: [store/Store.ts:933](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L933)

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

Defined in: [store/Store.ts:1093](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L1093)

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

Defined in: [store/Store.ts:1072](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L1072)

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

Defined in: [store/Store.ts:1117](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L1117)

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

Defined in: [store/Store.ts:855](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L855)

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

Defined in: [store/Store.ts:1292](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/store/Store.ts#L1292)

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
