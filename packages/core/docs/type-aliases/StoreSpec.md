[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreSpec

# Type Alias: StoreSpec\<R, S, EM\>

> **StoreSpec**\<`R`, `S`, `EM`\> = `object`

Defined in: [types.ts:284](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L284)

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

### dedupWindowMs?

> `optional` **dedupWindowMs**: `number`

Defined in: [types.ts:322](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L322)

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

Defined in: [types.ts:330](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L330)

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

### effects?

> `optional` **effects**: [`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:307](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L307)

Optional side-effect handlers registered at construction time.
Runs after reducers for every propagated event.

***

### middleware?

> `optional` **middleware**: [`MiddlewareInput`](MiddlewareInput.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:301](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L301)

Middleware chain executed before reducers/effects.
Accepts either functions (legacy) or MiddlewareSpec objects (recommended).
If any middleware returns false (or resolves to false), the event will not propagate.

***

### name

> **name**: `string`

Defined in: [types.ts:288](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L288)

Store name (used by DevTools to identify the instance).

***

### onEffectError()?

> `optional` **onEffectError**: (`error`, `event`) => `void`

Defined in: [types.ts:353](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L353)

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

### reducer

> **reducer**: `Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Defined in: [types.ts:294](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L294)

Map of slice name → reducer spec.
Each entry declares initial state, the reducer function, and the event targeting.
