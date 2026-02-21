[**@yoltra/react**](../README.md)

***

[@yoltra/react](../README.md) / useEmit

# Function: useEmit()

> **useEmit**\<`EM`\>(): `Emit`\<`EM`\>

Defined in: [react/src/hooks/hooks.ts:85](https://github.com/yoltra/yoltra/blob/7bf784f9e7daaf114608ff30306ac3400da926ed/packages/react/src/hooks/hooks.ts#L85)

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
