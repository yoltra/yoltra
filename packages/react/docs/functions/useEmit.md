[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useEmit

# Function: useEmit()

> **useEmit**\<`EM`\>(): `Emit`\<`EM`\>

Defined in: [hooks/hooks.ts:125](https://github.com/quojs/quojs/blob/3a7e48ef6dc2bf6db713ff04100a2a0e1ee72ff5/packages/react/src/hooks/hooks.ts#L125)

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
