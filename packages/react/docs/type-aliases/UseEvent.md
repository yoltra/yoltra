[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseEvent

# Type Alias: UseEvent()\<EM, S\>

> **UseEvent**\<`EM`, `S`\> = \<`C`, `T`\>(`channel`, `type`, `handler`, `phase?`) => `void`

Defined in: react/src/hooks/createHooks.ts:134

Call signature for the typed `useEvent` hook returned by [createHooks](../functions/createHooks.md).

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
const { useEvent } = createHooks(AppStoreContext);

function SaveNotifier() {
  useEvent('ui', 'save', (event) => {
    showToast('Saved!');
  });
  return null;
}
```
