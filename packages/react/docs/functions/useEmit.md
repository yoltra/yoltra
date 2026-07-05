[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useEmit

# Function: useEmit()

> **useEmit**\<`EM`\>(): `Emit`\<`EM`\>

Defined in: [react/src/hooks/hooks.ts:86](https://github.com/yoltra/yoltra/blob/ae94dea5790844eac37ee002f0fbed302029371e/packages/react/src/hooks/hooks.ts#L86)

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
