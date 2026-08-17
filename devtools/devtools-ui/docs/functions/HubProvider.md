![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubProvider

# Function: HubProvider()

> **HubProvider**(`__namedParameters`): `Element`

Defined in: [devtools-ui/src/context/HubProvider.tsx:77](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/context/HubProvider.tsx#L77)

Provides hub connection context to all child hooks and components.

## Parameters

### \_\_namedParameters

[`HubProviderProps`](../interfaces/HubProviderProps.md)

## Returns

`Element`

A React element wrapping children in `HubContext.Provider`.

## Remarks

On mount the provider opens a WebSocket to the hub, performs the protocol
handshake, and begins dispatching incoming messages to all subscribers. If
the connection drops and `autoReconnect` is enabled (default), it
reconnects with exponential backoff up to `maxReconnectAttempts`.

## Example

```tsx
import { HubProvider } from "@yoltra/devtools-ui";

function App() {
  return (
    <HubProvider config={{ port: 8900 }}>
      <DevToolsPanel />
    </HubProvider>
  );
}
```
