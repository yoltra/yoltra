[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / StoreSpec

# Type Alias: StoreSpec\<R, S, EM\>

> **StoreSpec**\<`R`, `S`, `EM`\> = `object`

Defined in: [types.ts:227](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L227)

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

Defined in: [types.ts:261](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L261)

Time window in milliseconds for event deduplication.
Events with identical fingerprints (channel + type + serialized payload)
within this window are considered duplicates and skipped.

This helps prevent double-firing in React Strict Mode.

#### Default

```ts
50 in development, 100 in production
```

***

### devtools?

> `optional` **devtools**: `object`

Defined in: [types.ts:269](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L269)

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

Defined in: [types.ts:250](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L250)

Optional side-effect handlers registered at construction time.
Runs after reducers for every propagated event.

***

### middleware?

> `optional` **middleware**: [`MiddlewareInput`](MiddlewareInput.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:244](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L244)

Middleware chain executed before reducers/effects.
Accepts either functions (legacy) or MiddlewareSpec objects (recommended).
If any middleware returns false (or resolves to false), the event will not propagate.

***

### name

> **name**: `string`

Defined in: [types.ts:231](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L231)

Store name (used by DevTools to identify the instance).

***

### reducer

> **reducer**: `Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Defined in: [types.ts:237](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L237)

Map of slice name → reducer spec.
Each entry declares initial state, the reducer function, and the event targeting.
