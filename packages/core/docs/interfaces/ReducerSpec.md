![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:1011](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1011)

One reducer's definition blob (stateful event consumer).

## Remarks

Use `when` for event targeting (preferred). The `events` property is
kept for backward compatibility but `when` is recommended for new code.

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

Defined in: [types.ts:1030](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1030)

Optional metadata for debugging tools and DevTools integration.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:1025](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1025)

Pure reducer function: `(state, event) => nextState`.

***

### state

> **state**: `S`

Defined in: [types.ts:1015](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1015)

Initial state for this reducer.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:1020](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1020)

Event targeting using the unified `When` matcher.
