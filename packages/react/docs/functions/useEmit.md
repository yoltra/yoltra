[**@quojs/react**](../README.md)

***

[@quojs/react](../README.md) / useEmit

# Function: useEmit()

> **useEmit**\<`EM`\>(): `Emit`\<`EM`\>

Defined in: [react/src/hooks/hooks.ts:85](https://github.com/quojs/quojs/blob/7a847d68175722f00e52941458a1511185cf0a4e/packages/react/src/hooks/hooks.ts#L85)

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
