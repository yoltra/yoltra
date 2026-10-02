![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EffectSpec

# Interface: EffectSpec\<S, EM\>

Defined in: [types.ts:1581](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1581)

Effect specification (stateless async event consumer).

## Remarks

- Effects run after reducers see the event.
- Effects are async-safe and do not own state.
- Effects are keyed by event for O(1) lookup (no scanning).
- Use `when` for event targeting (preferred over `events`).

## Examples

Using `when` (recommended)
```ts
const logEffect: EffectSpec<AppState, MyEM> = {
  when: { keys: eventKeys<MyEM>()([['ui', 'increment']]) },
  effect: async (evt, getState, emit) => {
    console.log('increment', evt.payload, getState().counter.value);
  },
  meta: { type: 'effect', name: 'logEffect', description: 'Logs increment events' },
};
```

```ts
const notificationEffect: EffectSpec<AppState, MyEM> = {
  when: { channel: 'notifications' },
  effect: (evt, getState, emit) => {
    if (evt.type === 'show') showToast(evt.payload.message);
  },
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

Defined in: [types.ts:1595](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1595)

Async effect handler: `(event, getState, emit) => void | Promise<void>`.

***

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"effect"`\>

Defined in: [types.ts:1600](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1600)

Optional metadata for debugging tools and DevTools integration.

***

### when?

> `optional` **when**: [`ExactWhen`](../type-aliases/ExactWhen.md)\<`EM`\>

Defined in: [types.ts:1590](https://github.com/yoltra/yoltra/blob/main/packages/core/src/types.ts#L1590)

Event targeting: one of the exact forms of the `When` matcher.

#### Remarks

`channelPattern` is not accepted here, by the type and at registration: every effect for
an event runs in sequence, and a pattern would hide which chains an effect joins. See
[ExactWhen](../type-aliases/ExactWhen.md).
