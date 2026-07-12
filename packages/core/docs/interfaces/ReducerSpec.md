[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / ReducerSpec

# Interface: ReducerSpec\<S, EM\>

Defined in: [types.ts:629](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L629)

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

Defined in: [types.ts:645](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L645)

List of EventKeys `[channel, type]` that this reducer responds to.

#### Deprecated

Use `when: { keys: [...] }` instead for better type inference.

***

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"reducer"`\>

Defined in: [types.ts:655](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L655)

Optional metadata for debugging tools and DevTools integration.

***

### reducer

> **reducer**: [`ReducerFunction`](../type-aliases/ReducerFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:650](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L650)

Pure reducer function: `(state, event) => nextState`.

***

### state

> **state**: `S`

Defined in: [types.ts:633](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L633)

Initial state for this reducer.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:639](https://github.com/yoltra/yoltra/blob/deb942c60b290a53939a9e286974c0da4e3f44ce/packages/core/src/types.ts#L639)

Event targeting using the unified `When` matcher.
Preferred over `events` for new code.
