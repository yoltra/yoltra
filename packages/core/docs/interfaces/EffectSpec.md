[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / EffectSpec

# Interface: EffectSpec\<S, EM\>

Defined in: [types.ts:606](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L606)

Effect specification (stateless async event consumer).

## Remarks

- Effects run after reducers see the event.
- Effects are async-safe and do not own state.
- Effects are keyed by event for O(1) lookup (no scanning).
- Use `when` for event targeting (preferred over `events`).

## Examples

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

Defined in: [types.ts:622](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L622)

Async effect handler: `(event, getState, emit) => void | Promise<void>`.

***

### ~~events?~~

> `optional` **events**: readonly [`EventKey`](../type-aliases/EventKey.md)\<`EM`\>[]

Defined in: [types.ts:617](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L617)

List of EventKeys `[channel, type]` that this effect responds to.

#### Deprecated

Use `when: { keys: [...] }` instead for better type inference.

***

### meta?

> `optional` **meta**: [`EventConsumerMeta`](EventConsumerMeta.md)\<`"effect"`\>

Defined in: [types.ts:627](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L627)

Optional metadata for debugging tools and DevTools integration.

***

### when?

> `optional` **when**: [`When`](../type-aliases/When.md)\<`EM`\>

Defined in: [types.ts:611](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L611)

Event targeting using the unified `When` matcher.
Preferred over `events` for new code.
