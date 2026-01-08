[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / StoreSpec

# Type Alias: StoreSpec\<R, S, EM\>

> **StoreSpec**\<`R`, `S`, `EM`\> = `object`

Defined in: [types.ts:166](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L166)

Store spec - what you feed into the constructor / factory.

## Example

```ts
type S = { counter: { value: number } };
type EM = { ui: { increment: number } };

const spec: StoreSpec<'counter', S, EM> = {
  name: 'App',
  reducer: {
    counter: {
      state: { value: 0 },
      events: [['ui', 'increment']],
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

### effects?

> `optional` **effects**: [`EffectSpec`](../interfaces/EffectSpec.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:188](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L188)

Optional side-effect handlers registered at construction time (runs after reducers for every propagated event).
Equivalent to calling store.registerEffect for each item.

***

### middleware?

> `optional` **middleware**: [`MiddlewareFunction`](MiddlewareFunction.md)\<[`DeepReadonly`](DeepReadonly.md)\<`S`\>, `EM`\>[]

Defined in: [types.ts:182](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L182)

Middleware chain executed before reducers/effects.
If any middleware returns false (or resolves to false), the event will not propagate to reducers/effects.

***

### name

> **name**: `string`

Defined in: [types.ts:170](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L170)

Store name (used by DevTools to identify the instance).

***

### reducer

> **reducer**: `Record`\<`R`, [`ReducerSpec`](../interfaces/ReducerSpec.md)\<`S`\[`R`\], `EM`\>\>

Defined in: [types.ts:176](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L176)

Map of slice name → reducer spec.
Each entry declares initial state, the reducer function, and the list of EventKeys this slice responds to.
