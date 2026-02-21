[**@yoltra/core**](../README.md)

***

[@yoltra/core](../README.md) / NarrowedEventHandler

# Type Alias: NarrowedEventHandler()\<S, EM, C, T\>

> **NarrowedEventHandler**\<`S`, `EM`, `C`, `T`\> = (`event`, `getState`, `emit`, `phase`) => `void` \| `Promise`\<`void`\>

Defined in: [types.ts:1087](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/core/src/types.ts#L1087)

Narrowed event subscription handler for specific `(channel, type)` pairs.
Provides better type inference when subscribing to a single event type.

## Type Parameters

### S

`S`

Store state type (readonly).

### EM

`EM` *extends* [`EventMapBase`](EventMapBase.md)

Event map.

### C

`C` *extends* keyof `EM` & `string`

Channel key within `EM`.

### T

`T` *extends* keyof `EM`\[`C`\] & `string`

Event type key within channel `C`.

## Parameters

### event

[`Event`](../interfaces/Event.md)\<`EM`, `C`, `T`\>

### getState

() => `S`

### emit

[`Emit`](Emit.md)\<`EM`\>

### phase

`"committed"` | `"uncommitted"`

## Returns

`void` \| `Promise`\<`void`\>

## Example

```ts
const handler: NarrowedEventHandler<AppState, AppEM, 'ui', 'increment'> = (
  event, // Event<AppEM, 'ui', 'increment'> - narrowed!
  getState,
  emit,
  phase,
) => {
  // event.payload is typed as number (from EM['ui']['increment'])
  console.log('Increment by:', event.payload);
};
```
