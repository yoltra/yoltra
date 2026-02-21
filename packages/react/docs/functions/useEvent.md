[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useEvent

# Function: useEvent()

> **useEvent**\<`EM`, `C`, `T`\>(`channel`, `type`, `handler`, `phase`): `void`

Defined in: [react/src/hooks/hooks.ts:500](https://github.com/yoltra/yoltra/blob/a987f4d35946c58f44d8b45d3fefadd911124683/packages/react/src/hooks/hooks.ts#L500)

Subscribe to store events from a React component.

This hook enables reactive UI patterns by allowing components to respond
to specific events without selecting state. Useful for:
- Showing notifications on certain events
- Triggering animations
- Logging/analytics
- Responding to rejected (uncommitted) events

**Phases:**
- `'committed'` (default): Events that passed middleware and reached reducers
- `'uncommitted'`: Events rejected by middleware
- `'all'`: Both committed and uncommitted events (handler receives phase parameter)

## Type Parameters

### EM

`EM` *extends* `EventMapBase`

Event map type.

### C

`C` *extends* `string`

Channel key within `EM`.

### T

`T` *extends* `string`

Event type key within channel `C`.

## Parameters

### channel

`C`

Event channel to subscribe to.

### type

`T`

Event type to subscribe to.

### handler

(`event`, `getState`, `emit`, `phase`) => `void` \| `Promise`\<`void`\>

Handler called when the event fires. Receives `(event, getState, emit, phase)`.

### phase

`EventPhase` = `"committed"`

Event phase to subscribe to (default: `'committed'`).

## Returns

`void`

## Examples

```tsx
useEvent('ui', 'save', (event, getState, emit, phase) => {
  showToast('Saved successfully!');
});
```

```tsx
useEvent('ui', 'delete', (event, getState, emit, phase) => {
  showToast('Delete was blocked by middleware');
}, 'uncommitted');
```

```tsx
useEvent('ui', 'action', (event, getState, emit, phase) => {
  console.log('Action:', phase); // 'committed' or 'uncommitted'
}, 'all');
```
