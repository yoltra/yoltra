![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubConnectionConfig

# Interface: HubConnectionConfig

Defined in: [devtools-ui/src/types.ts:37](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L37)

Connection configuration for the DevTools hub.

## Remarks

Pass this to [HubProvider](../functions/HubProvider.md) to control how the extension connects to
the hub server. The only required field is `port`; all other fields have
sensible defaults.

## Example

```tsx
const config: HubConnectionConfig = {
  port: 8900,
  extensionName: "My Panel",
  autoReconnect: true,
};

<HubProvider config={config}>
  <App />
</HubProvider>
```

## Properties

### autoReconnect?

> `optional` **autoReconnect**: `boolean`

Defined in: [devtools-ui/src/types.ts:45](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L45)

Auto-reconnect on disconnect.

#### Default Value

`true`

***

### extensionName?

> `optional` **extensionName**: `string`

Defined in: [devtools-ui/src/types.ts:43](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L43)

Display name for this extension instance.

***

### host?

> `optional` **host**: `string`

Defined in: [devtools-ui/src/types.ts:39](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L39)

Hub server host.

#### Default Value

`"localhost"`

***

### maxReconnectAttempts?

> `optional` **maxReconnectAttempts**: `number`

Defined in: [devtools-ui/src/types.ts:47](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L47)

Maximum reconnect attempts.

#### Default Value

`Infinity`

***

### port

> **port**: `number`

Defined in: [devtools-ui/src/types.ts:41](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L41)

Hub server port.

***

### WebSocket()?

> `optional` **WebSocket**: (`url`) => `WebSocket`

Defined in: [devtools-ui/src/types.ts:56](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L56)

Custom WebSocket constructor.

#### Parameters

##### url

`string`

#### Returns

`WebSocket`

#### Remarks

Defaults to the global `WebSocket`. Pass a constructor to use another
implementation, for example an in-memory loopback such as the one
`createLoopbackHub` returns.
