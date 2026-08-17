![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / useHubConnection

# Function: useHubConnection()

> **useHubConnection**(): [`HubContextValue`](../interfaces/HubContextValue.md)

Defined in: [devtools-ui/src/hooks/useHubConnection.ts:43](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/hooks/useHubConnection.ts#L43)

Access the hub connection context.

## Returns

[`HubContextValue`](../interfaces/HubContextValue.md)

The hub connection context value (see [HubContextValue](../interfaces/HubContextValue.md)).

## Remarks

Must be used within a [HubProvider](HubProvider.md). If called outside a provider
the returned value contains safe no-op functions and a `"disconnected"`
status.

## Example

```tsx
import { useHubConnection } from "@yoltra/devtools-ui";

function ConnectionStatus() {
  const { status, reconnect } = useHubConnection();
  return (
    <div>
      <span>Status: {status}</span>
      <button onClick={reconnect}>Reconnect</button>
    </div>
  );
}
```
