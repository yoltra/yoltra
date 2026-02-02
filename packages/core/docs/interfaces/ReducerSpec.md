[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:393](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L393)

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

Defined in: [types.ts:397](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L397)

List of EventKeys `[channel, type]` that this reducer responds to.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:402](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L402)

Pure reducer function: `(state, event) => nextState`.

***

### state

> **state**: `S`

Defined in: [types.ts:407](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L407)

Initial state for this reducer.
