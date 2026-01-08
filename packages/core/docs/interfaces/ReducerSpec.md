[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:333](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L333)

One reducer's definition blob (stateful event consumer).

## Example

```ts
const counterSpec: ReducerSpec<{ value: number }, MyEM> = {
  state: { value: 0 },
  events: [['ui', 'increment'], ['ui', 'decrement']],
  reducer(s, evt) {
    if (evt.type === 'increment') return { value: s.value + evt.payload };
    if (evt.type === 'decrement') return { value: s.value - evt.payload };
    return s;
  }
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

### events

> **events**: readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [types.ts:337](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L337)

List of EventKeys `[channel, type]` that this reducer responds to.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:342](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L342)

Pure reducer function: `(state, event) => nextState`.

***

### state

> **state**: `S`

Defined in: [types.ts:347](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L347)

Initial state for this reducer.
