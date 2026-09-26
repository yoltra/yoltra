![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / UseEvent

# Type Alias: UseEvent()\<EM, S\>

> **UseEvent**\<`EM`, `S`\> = \<`C`, `T`\>(`channel`, `type`, `handler`, `phase?`, `options?`) => `void`

Defined in: [react/src/hooks/createHooks.ts:149](https://github.com/yoltra/yoltra/blob/main/packages/react/src/hooks/createHooks.ts#L149)

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

### options?

#### duringReplay?

`boolean`

Also run this handler while devtools is replaying, which it does not by default.

**Remarks**

Opt in only for a handler that derives view state purely from the event stream. A
handler that publishes, writes or notifies must stay out: scrubbing a timeline is a
debugging operation and should not reach a peer, a socket or an analytics endpoint.

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
