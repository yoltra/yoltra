![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubContextValue

# Interface: HubContextValue

Defined in: [devtools-ui/src/types.ts:139](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L139)

Hub connection context value provided to consumers.

## Remarks

This is the shape of the value exposed by [HubContext](../variables/HubContext.md) and consumed
via [useHubConnection](../functions/useHubConnection.md). It contains methods for sending messages,
subscribing to incoming messages, and controlling the connection lifecycle.

## Properties

### disconnect()

> **disconnect**: () => `void`

Defined in: [devtools-ui/src/types.ts:162](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L162)

Manually disconnect from the hub and cancel auto-reconnect.

#### Returns

`void`

***

### extensionId

> **extensionId**: `string`

Defined in: [devtools-ui/src/types.ts:149](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L149)

This panel's identity, as given to the hub at handshake.

#### Remarks

Stamped on every message the panel sends. It used to send an empty string, so the hub could
not tell one panel's commands from another's — with several open, or an authenticated hub
auditing who drove a store, there was nothing to attribute a time-travel or an injected
event to.

***

### reconnect()

> **reconnect**: () => `void`

Defined in: [devtools-ui/src/types.ts:164](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L164)

Reset reconnect attempts and establish a fresh connection.

#### Returns

`void`

***

### send()

> **send**: (`message`) => `void`

Defined in: [devtools-ui/src/types.ts:153](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L153)

Send a protocol message to the hub.

#### Parameters

##### message

`DevtoolsMessage`

#### Returns

`void`

***

### status

> **status**: [`HubConnectionStatus`](../type-aliases/HubConnectionStatus.md)

Defined in: [devtools-ui/src/types.ts:151](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L151)

Current connection status.

***

### subscribe()

> **subscribe**: (`handler`) => () => `void`

Defined in: [devtools-ui/src/types.ts:160](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L160)

Subscribe to incoming hub messages.

#### Parameters

##### handler

(`message`) => `void`

Callback invoked for every incoming message.

#### Returns

An unsubscribe function.

> (): `void`

##### Returns

`void`
