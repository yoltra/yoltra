![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:1369](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1369)

One reducer's definition blob (stateful event consumer).

## Remarks

Use `when` for event targeting. An earlier `events` array was removed; this remark
outlived it and described a property that no longer exists.

**A reducer receives exactly one slice and returns exactly one slice.** `state` here is this
reducer's own slice, not the store's state, and the value returned is written back only under
this reducer's name. There is no path to a sibling: the reducer is handed no `getState`, no
store reference, and no second argument beyond the event, and returning a whole-store-shaped
object writes nothing extra because the commit is keyed by the name the reducer was mounted
under.

So cross-slice isolation is a **framework guarantee, not a convention**. There is no second
writer to a slice and therefore no intra-slice authorisation question — only the ordinary
question of whether this reducer's own code is correct. The one cross-slice effect available is
a [Rejection](Rejection.md), which refuses the whole event rather than writing anywhere.

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

Defined in: [types.ts:1393](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1393)

Optional metadata for debugging tools and DevTools integration.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:1388](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1388)

Pure reducer function: `(state, event) => nextState`, where `state` is this reducer's slice
and the return value replaces that slice and nothing else.

***

### state

> **state**: `S`

Defined in: [types.ts:1373](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1373)

Initial state for this reducer's own slice.

***

### when?

> `optional` **when**: [`ExactWhen`](../type-aliases/ExactWhen.md)\<`EM`\>

Defined in: [types.ts:1382](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1382)

Event targeting: one of the exact forms of the `When` matcher.

#### Remarks

`channelPattern` is not accepted here, by the type and at registration: a reducer's input
set has to be closed and readable from its spec. See [ExactWhen](../type-aliases/ExactWhen.md).
