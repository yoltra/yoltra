[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseEvent

# Type Alias: UseEvent()\<EM, S\>

> **UseEvent**\<`EM`, `S`\> = \<`C`, `T`\>(`channel`, `type`, `handler`, `phase?`) => `void`

Defined in: [react/src/hooks/createQuoHooks.ts:134](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/createQuoHooks.ts#L134)

Call signature for the typed `useEvent` hook returned by [createQuoHooks](../functions/createQuoHooks.md).

Subscribes to store events from a React component. Useful for notifications,
animations, analytics, and responding to rejected (uncommitted) events.

## Type Parameters

### EM

`EM` *extends* `EventMapBase`

Event map type.

### S

`S`

Store state type.

## Type Parameters

### C

`C` *extends* keyof `EM` & `string`

### T

`T` *extends* keyof `EM`\[`C`\] & `string`

## Parameters

### channel

`C`

### type

`T`

### handler

(`event`, `getState`, `emit`, `phase`) => `void` \| `Promise`\<`void`\>

### phase?

`EventPhase`

## Returns

`void`

## Example

```tsx
const { useEvent } = createQuoHooks(AppStoreContext);

function SaveNotifier() {
  useEvent('ui', 'save', (event) => {
    showToast('Saved!');
  });
  return null;
}
```
