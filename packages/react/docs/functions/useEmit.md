[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useEmit

# Function: useEmit()

> **useEmit**\<`EM`\>(): `Emit`\<`EM`\>

Defined in: [react/src/hooks/hooks.ts:104](https://github.com/quojs/quojs/blob/90b047cd5df060b28c5f76a1ad4792631061e571/packages/react/src/hooks/hooks.ts#L104)

Returns the store's `emit` function (stable reference).

## Type Parameters

### EM

`EM` *extends* `EventMapBase`

Event map type.

## Returns

`Emit`\<`EM`\>

## Example

```tsx
const emit = useEmit<MyEM>();
await emit('ui', 'toggle', true);
```
