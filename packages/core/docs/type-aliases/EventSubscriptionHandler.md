[**@quojs/core**](../README.md)

***

[@quojs/core](../README.md) / EventSubscriptionHandler

# Type Alias: EventSubscriptionHandler()\<S, EM\>

> **EventSubscriptionHandler**\<`S`, `EM`\> = (`event`, `getState`, `emit`, `phase`) => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:1007](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/core/src/types.ts#L1007)

Handler function for event subscriptions (receives full event union).

Event subscriptions are intended for the View layer (e.g., React components)
to react to events without affecting the event flow. They are fire-and-forget
and cannot cancel event propagation.

## Type Parameters

### S

`S` = `any`

Store state type (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md) = [`EventMapBase`](EventMapBase.md)

Event map.

## Parameters

### event

[`EventUnion`](EventUnion.md)\<`EM`\>

The event that was emitted

### getState

() => `S`

Function to get current state

### emit

[`Emit`](Emit.md)\<`EM`\>

Function to emit new events

### phase

The phase ('committed' or 'uncommitted') indicating how the event was processed

`"committed"` | `"uncommitted"`

## Returns

`void` \| `Promise`\<`void`\>

## Example

```ts
const handler: EventSubscriptionHandler<AppState, AppEM> = (event, getState, emit, phase) => {
  if (phase === 'committed') {
    console.log('Event committed:', event.type);
  } else {
    console.log('Event rejected:', event.type);
  }
};
```
