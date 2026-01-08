[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EffectSpec

# Interface: EffectSpec\<S, EM\>

Defined in: [types.ts:387](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L387)

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

Defined in: [types.ts:396](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L396)

Async effect handler: `(event, getState, emit) => void | Promise<void>`.

***

### events

> **events**: readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [types.ts:391](https://github.com/quojs/quojs/blob/8b1c0adc6b9ff8a764bce1cedbec68a1d02e95ee/packages/core/src/types.ts#L391)

List of EventKeys `[channel, type]` that this effect responds to.
