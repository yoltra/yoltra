[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EffectSpec

# Interface: EffectSpec\<S, EM\>

Defined in: [types.ts:447](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L447)

Effect specification (stateless async event consumer).

## Remarks

- Effects subscribe to EventKeys (like reducers).
- Effects are async and do not own state.
- Effects run after reducers.
- Effects are keyed (no scanning all effects on every event).

## Example

```ts
const logEffect: EffectSpec<AppState, MyEM> = {
  events: [['ui', 'increment']],
  effect: async (evt, getState, emit) => {
    console.log('increment', evt.payload, getState().counter.value);
  }
};
```

## Type Parameters

### S

`S` = `any`

Store state type (readonly).

### EM

`EM` *extends* [`EventMapBase`](../type-aliases/EventMapBase.md) = [`EventMapBase`](../type-aliases/EventMapBase.md)

Event map.

## Properties

### effect

> **effect**: [`EffectFunction`](../type-aliases/EffectFunction.md)\<`S`, `EM`\>

Defined in: [types.ts:456](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L456)

Async effect handler: `(event, getState, emit) => void | Promise<void>`.

***

### events

> **events**: readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [types.ts:451](https://github.com/quojs/quojs/blob/d7e7368223439ffec372ae1e5232d6f03b0a0e1f/packages/core/src/types.ts#L451)

List of EventKeys `[channel, type]` that this effect responds to.
