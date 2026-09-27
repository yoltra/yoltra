![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:1106](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1106)

One reducer's definition blob (stateful event consumer).

## Remarks

Use `when` for event targeting. An earlier `events` array was removed; this remark
outlived it and described a property that no longer exists.

## Example

Using `when` (recommended)
```ts
const counterSpec: ReducerSpec<{ value: number }, MyEM> = {
  state: { value: 0 },
  when: { keys: eventKeys<MyEM>()([['ui', 'increment'], ['ui', 'decrement']]) },
  reducer(s, evt) {
    if (evt.type === 'increment') return { value: s.value + evt.payload };
    if (evt.type === 'decrement') return { value: s.value - evt.payload };
    return s;
  },
  meta: { type: 'reducer', name: 'counter' },
};
```

## Type Parameters

### S

`S` = `any`

State managed by this reducer.

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"reducer"`\>

Defined in: [types.ts:1125](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1125)

Optional metadata for debugging tools and DevTools integration.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:1120](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1120)

Pure reducer function: `(state, event) => nextState`.

***

### state

> **state**: `S`

Defined in: [types.ts:1110](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1110)

Initial state for this reducer.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1115](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1115)

Event targeting using the unified `When` matcher.
