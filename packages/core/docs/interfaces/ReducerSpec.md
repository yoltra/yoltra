[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:434](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L434)

One reducer's definition blob (stateful event consumer).

## Remarks

Use `when` for event targeting (preferred). The `events` property is
kept for backward compatibility but `when` is recommended for new code.

## Examples

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

```ts
const counterSpec: ReducerSpec<{ value: number }, MyEM> = {
  state: { value: 0 },
  events: [['ui', 'increment'], ['ui', 'decrement']],
  reducer(s, evt) { ... },
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

### ~~events?~~

> `optional` **events**: readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [types.ts:450](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L450)

List of EventKeys `[channel, type]` that this reducer responds to.

#### Deprecated

Use `when: { keys: [...] }` instead for better type inference.

***

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"reducer"`\>

Defined in: [types.ts:460](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L460)

Optional metadata for debugging tools and DevTools integration.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:455](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L455)

Pure reducer function: `(state, event) => nextState`.

***

### state

> **state**: `S`

Defined in: [types.ts:438](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L438)

Initial state for this reducer.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:444](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/core/src/types.ts#L444)

Event targeting using the unified `When` matcher.
Preferred over `events` for new code.
