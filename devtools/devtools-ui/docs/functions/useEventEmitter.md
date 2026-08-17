![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useEventEmitter

# Function: useEventEmitter()

> **useEventEmitter**(`storeId`): `object`

Defined in: [devtools-ui/src/hooks/useEventEmitter.ts:47](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useEventEmitter.ts#L47)

Emits events to a store from the extension.

## Parameters

### storeId

The store ID to emit events to, or `null` to disable.

`null` | `string`

## Returns

`object`

An object containing the `emit(channel, type, payload)` function.

### emit()

> **emit**: (`channel`, `type`, `payload`) => `void`

#### Parameters

##### channel

`string`

##### type

`string`

##### payload

`unknown`

#### Returns

`void`

## Remarks

The returned `emit` function is referentially stable (memoised via
`useCallback`) and safe to include in dependency arrays. Calling `emit`
when `storeId` is `null` is a no-op.

## Example

```tsx
import { useEventEmitter } from "@yoltra/devtools-ui";

function EmitForm({ storeId }: { storeId: string }) {
  const { emit } = useEventEmitter(storeId);

  const handleClick = () => {
    emit("counter", "INCREMENT", { amount: 1 });
  };

  return <button onClick={handleClick}>Increment Counter</button>;
}
```
