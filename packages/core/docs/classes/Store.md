[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / Store

# Class: Store\<AM, R, S\>

Defined in: [store/Store.ts:93](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L93)

Strongly-typed, channel/event-driven **store** with:
- **Slice reducers** (namespaced under `R`)
- **Middleware** (pre-reducer, can cancel propagation)
- **Effects** (post-reducer, async-safe)
- **Granular subscriptions** via dotted **property paths** (e.g., `"todos.3.title"`)
- Optional **Redux DevTools** integration (dev)

## Remarks

- `dispatch()` is **serialized** internally: actions are queued and processed one-by-one.
- Reducers are wired through an internal [EventBus](EventBus.md) by `(channel, event)`.
- Fine-grained change events are emitted through a [LooseEventBus](LooseEventBus.md) by **dotted paths**.
- State is **frozen** (shallowly, per-slice snapshot) before committing to discourage mutation.

## Example

```ts
// Define slices
type Counter = { value: number };
type Todos = { items: Array<{ id: string; title: string }> };

type S = { counter: Counter; todos: Todos };
type AM = {
  ui: { increment: number; setTitle: { id: string; title: string } };
};

const store = createStore({
  name: 'Demo',
  reducer: {
    counter: {
      state: { value: 0 },
      actions: [['ui', 'increment']],
      reducer(s, a) {
        if (a.event === 'increment') return { value: s.value + a.payload };
        return s;
      }
    },
    todos: {
      state: { items: [] },
      actions: [['ui', 'setTitle']],
      reducer(s, a) {
        if (a.event === 'setTitle') {
          const next = structuredClone(s);
          const t = next.items.find(x => x.id === a.payload.id);
          if (t) t.title = a.payload.title;
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

// Dispatch
store.dispatch('ui', 'increment', 1);
```

## Type Parameters

### AM

`AM` *extends* [`ActionMapBase`](../type-aliases/ActionMapBase.md)

Action map describing `(channel → event → payload)` types.

### R

`R` *extends* `string`

Union of slice names (string literal union).

### S

`S` *extends* `Record`\<`R`, `any`\>

Object map of slice states keyed by `R`.

## Implements

- [`StoreInstance`](../interfaces/StoreInstance.md)\<`R`, `S`, `AM`\>

## Constructors

### Constructor

> **new Store**\<`AM`, `R`, `S`\>(`spec`): `Store`\<`AM`, `R`, `S`\>

Defined in: [store/Store.ts:174](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L174)

Creates a store from a [StoreSpec](../type-aliases/StoreSpec.md).

#### Parameters

##### spec

[`StoreSpec`](../type-aliases/StoreSpec.md)\<`R`, `S`, `AM`\> & `object`

Store configuration (name, reducers, middleware, optional effects).

#### Returns

`Store`\<`AM`, `R`, `S`\>

## Properties

### name

> **name**: `string`

Defined in: [store/Store.ts:99](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L99)

Store name (used by DevTools & diagnostics).

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`name`](../interfaces/StoreInstance.md#name)

## Methods

### connect()

> **connect**(`spec`, `h`): () => `void`

Defined in: [store/Store.ts:530](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L530)

Connects a **fine-grained** listener to a dotted path under a slice.

#### Parameters

##### spec

`{ reducer, property }` where `property` is a dotted path (e.g., `"items.0.title"`).

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

#### Example

```ts
const off = store.connect({ reducer: 'todos', property: 'items.0.title' }, (chg) => {
  console.log('title change:', chg);
});
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`connect`](../interfaces/StoreInstance.md#connect)

***

### dispatch()

> **dispatch**\<`C`, `E`\>(`channel`, `event`, `payload`): `Promise`\<`void`\>

Defined in: [store/Store.ts:446](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L446)

Dispatches a typed action `(channel, event, payload)`.
Actions are queued and processed **sequentially**.

Pipeline per action:
1) **Middleware** (may cancel by returning `false`)
2) **Reducers** (via internal reducer bus)
3) **Effects** (async, errors swallowed)
4) **DevTools** (dev)

#### Type Parameters

##### C

`C` *extends* `string` \| `number` \| `symbol`

Channel key in `AM`.

##### E

`E` *extends* `string` \| `number` \| `symbol`

Event key within channel `C`.

#### Parameters

##### channel

`C`

Channel name.

##### event

`E`

Event name.

##### payload

`AM`\[`C`\]\[`E`\]

Payload typed as `AM[C][E]`.

#### Returns

`Promise`\<`void`\>

A promise that resolves when the action has finished processing.

#### Example

```ts
await store.dispatch('ui', 'increment', 1);
```

#### Implementation of

`StoreInstance.dispatch`

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Defined in: [store/Store.ts:557](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L557)

Returns the current immutable state snapshot.

#### Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`getState`](../interfaces/StoreInstance.md#getstate)

***

### hotReplace()

> **hotReplace**(`partial`): `void`

Defined in: [store/Store.ts:717](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L717)

Convenience API to replace **any subset** of store parts (HMR patterns).

#### Parameters

##### partial

Partial replacement set.

###### effects?

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

###### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

###### preserveState?

`boolean`

###### reducer?

`Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `AM`\>\>

#### Returns

`void`

***

### onEffect()

> **onEffect**\<`C`, `E`\>(`channel`, `event`, `handler`): () => `void`

Defined in: [store/Store.ts:293](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L293)

Convenience helper to register an **effect** filtered by `(channel, event)`.

#### Type Parameters

##### C

`C` *extends* `string`

Channel key within `AM`.

##### E

`E` *extends* `string`

Event key within channel `C`.

#### Parameters

##### channel

`C`

Channel to filter.

##### event

`E`

Event to filter.

##### handler

(`payload`, `getState`, `dispatch`, `action`) => `void` \| `Promise`\<`void`\>

Effect handler `(payload, getState, dispatch, action)`.

#### Returns

Unsubscribe/teardown function.

> (): `void`

##### Returns

`void`

#### Example

```ts
const off = store.onEffect('ui', 'increment', async (n, get, dispatch) => {
  if (n > 10) await dispatch('ui', 'increment', -10);
});
// later
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`onEffect`](../interfaces/StoreInstance.md#oneffect)

***

### registerEffect()

> **registerEffect**(`handler`): () => `void`

Defined in: [store/Store.ts:640](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L640)

Registers an **effect** that runs after reducers have updated state.

#### Parameters

##### handler

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>

`(action, getState, dispatch) => void|Promise<void>`.

#### Returns

Unsubscribe function.

> (): `void`

##### Returns

`void`

#### Example

```ts
const off = store.registerEffect(async (a, get, dispatch) => {
  if (a.channel === 'ui' && a.event === 'increment') {
    await dispatch('ui', 'increment', -1);
  }
});
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerEffect`](../interfaces/StoreInstance.md#registereffect)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [store/Store.ts:578](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L578)

Registers a middleware (runs **before** reducers).

#### Parameters

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>

Middleware `(state, action, dispatch) => boolean|Promise<boolean>`.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function that removes this middleware.

#### Example

```ts
const off = store.registerMiddleware(async (state, action) => {
  console.log('action', action);
  return true; // allow
});
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerMiddleware`](../interfaces/StoreInstance.md#registermiddleware)

***

### registerReducer()

> **registerReducer**(`name`, `spec`): () => `void`

Defined in: [store/Store.ts:606](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L606)

Dynamically **adds** a named slice reducer at runtime.

#### Parameters

##### name

`string`

New slice name (must not already exist).

##### spec

[`ReducerSpec`](../interfaces/ReducerSpec.md)\<`any`, `AM`\>

Reducer spec (state, actions, reducer).

#### Returns

Disposer function that **removes** the slice (and its state).

> (): `void`

##### Returns

`void`

#### Example

```ts
const dispose = store.registerReducer('filters', {
  state: { q: '' },
  actions: [['ui', 'setQuery']],
  reducer(s, a) { return a.event === 'setQuery' ? { q: a.payload } : s; }
});
// Later:
dispose();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`registerReducer`](../interfaces/StoreInstance.md#registerreducer)

***

### replaceEffects()

> **replaceEffects**(`next`): `void`

Defined in: [store/Store.ts:660](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L660)

Replaces all registered **effects** (HMR-friendly).

#### Parameters

##### next

[`EffectFunction`](../type-aliases/EffectFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

New effects set.

#### Returns

`void`

***

### replaceMiddleware()

> **replaceMiddleware**(`next`): `void`

Defined in: [store/Store.ts:650](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L650)

Replaces the **entire** middleware pipeline (HMR-friendly).

#### Parameters

##### next

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `AM`\>[]

New middleware array.

#### Returns

`void`

***

### replaceReducers()

> **replaceReducers**(`next`, `opts`): `void`

Defined in: [store/Store.ts:680](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L680)

Replaces the entire **reducer set** (HMR-friendly).

#### Parameters

##### next

`Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `AM`\>\>

Map of slice specs keyed by slice name.

##### opts

`{ preserveState?: boolean }` (default `true`).

###### preserveState?

`boolean`

#### Returns

`void`

#### Example

```ts
store.replaceReducers({
  counter: { state: { value: 0 }, actions: [['ui','increment']], reducer: rfn }
}, { preserveState: true });
```

***

### subscribe()

> **subscribe**(`fn`): () => `void`

Defined in: [store/Store.ts:548](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L548)

Subscribes to **coarse-grained** commits (called once per successful action).

#### Parameters

##### fn

() => `void`

Listener invoked after reducers/effects have run.

#### Returns

Unsubscribe function.

> (): `void`

##### Returns

`void`

#### Example

```ts
const off = store.subscribe(() => console.log('state committed'));
off();
```

#### Implementation of

[`StoreInstance`](../interfaces/StoreInstance.md).[`subscribe`](../interfaces/StoreInstance.md#subscribe)

***

### buildAncestorPaths()

> `static` **buildAncestorPaths**(`path`): `string`[]

Defined in: [store/Store.ts:838](https://github.com/quojs/quojs/blob/67acf22c99f7bb5bc1300e174ce891cc1abf66aa/packages/core/src/store/Store.ts#L838)

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
