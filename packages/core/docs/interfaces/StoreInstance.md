[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreInstance

# Interface: StoreInstance\<R, S, EM\>

Defined in: [types.ts:368](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L368)

Public Store surface.

## Remarks

The concrete Store implements this as `StoreInstance<R, DeepReadonly<S>, EM>`.

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

Defined in: [types.ts:387](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L387)

Emit a typed event `(channel, type, payload)`.
Returns a promise that resolves when the event has been processed.

***

### name

> **name**: `string`

Defined in: [types.ts:376](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L376)

Store name (used by DevTools to identify the instance).

## Methods

### connect()

> **connect**(`spec`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:402](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L402)

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

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### dispose()

> **dispose**(): `void`

Defined in: [types.ts:448](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L448)

Cleanup resources (timers, etc.) when disposing the store.
Call this if you're dynamically creating/destroying stores.

#### Returns

`void`

***

### getState()

> **getState**(): [`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

Defined in: [types.ts:381](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L381)

Read the full state (already readonly).

#### Returns

[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>

***

### hotReplace()

> **hotReplace**(`partial`): `void`

Defined in: [types.ts:528](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L528)

Convenience API to replace any subset of store parts (HMR patterns).

#### Parameters

##### partial

Partial replacement set.

###### effects?

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### middleware?

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

###### preserveState?

`boolean`

###### reducer?

`Record`\<`R`, [`ReducerSpec`](ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

#### Returns

`void`

***

### instrument()

> **instrument**(`observer`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:580](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L580)

Registers an instrumentation observer, called once per emitted event
(committed or vetoed) after the synchronous reduce phase, with the exact
changed paths, their old/new values, and reduce timing. This is the typed
seam DevTools agents consume — no `as any` bridging required.

#### Parameters

##### observer

[`InstrumentationObserver`](../type-aliases/InstrumentationObserver.md)\<`EM`\>

Receives an [InstrumentedEvent](InstrumentedEvent.md) per emit.

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe function.

***

### onEffect()

> **onEffect**\<`C`, `T`\>(`channel`, `type`, `handler`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:415](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L415)

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

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

Unsubscribe/teardown function.

***

### onEvent()

> **onEvent**\<`C`, `T`\>(`channel`, `type`, `handler`, `phase?`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:491](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L491)

Subscribe to events by channel and type.

Event subscriptions are intended for the View layer (e.g., React components)
to react to events without affecting the event flow. They are fire-and-forget
and cannot cancel event propagation.

**Phases:**
- `'committed'` (default): Events that passed middleware and reached reducers
- `'uncommitted'`: Events rejected by middleware
- `'all'`: Both committed and uncommitted events (handler receives phase parameter)

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

### registerEffect()

> **registerEffect**(`spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:432](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L432)

Register a post-reducer effect (sees final state). Returns an unsubscribe.

#### Parameters

##### spec

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerMiddleware()

> **registerMiddleware**(`mw`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:437](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L437)

Dynamically add middleware.

#### Parameters

##### mw

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### registerReducer()

> **registerReducer**(`name`, `spec`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:442](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L442)

Dynamically add/remove a namespaced reducer slice at runtime.

#### Parameters

##### name

`string`

##### spec

[`ReducerSpec`](ReducerSpec.md)\<`any`, `EM`\>

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)

***

### replaceEffects()

> **replaceEffects**(`next`): `void`

Defined in: [types.ts:510](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L510)

Replaces all registered effects (HMR-friendly).

#### Parameters

##### next

[`EffectSpec`](EffectSpec.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New effects array (as EffectSpecs).

#### Returns

`void`

***

### replaceMiddleware()

> **replaceMiddleware**(`next`): `void`

Defined in: [types.ts:503](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L503)

Replaces the entire middleware pipeline (HMR-friendly).

#### Parameters

##### next

[`MiddlewareFunction`](../type-aliases/MiddlewareFunction.md)\<[`DeepReadonly`](../type-aliases/DeepReadonly.md)\<`S`\>, `EM`\>[]

New middleware array.

#### Returns

`void`

***

### replaceReducers()

> **replaceReducers**(`next`, `opts?`): `void`

Defined in: [types.ts:518](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L518)

Replaces the entire reducer set (HMR-friendly).

#### Parameters

##### next

`Record`\<`R`, [`ReducerSpec`](ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Map of slice specs keyed by slice name.

##### opts?

`{ preserveState?: boolean }` (default `true`).

###### preserveState?

`boolean`

#### Returns

`void`

***

### subscribe()

> **subscribe**(`listener`): [`Unsubscribe`](../type-aliases/Unsubscribe.md)

Defined in: [types.ts:392](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L392)

Coarse subscription: runs after any state change (once per committed event).

#### Parameters

##### listener

() => `void`

#### Returns

[`Unsubscribe`](../type-aliases/Unsubscribe.md)
