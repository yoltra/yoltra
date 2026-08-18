![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubContextValue

# Interface: HubContextValue

Defined in: [devtools-ui/src/types.ts:136](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L136)

Hub connection context value provided to consumers.

## Remarks

This is the shape of the value exposed by [HubContext](../variables/HubContext.md) and consumed
via [useHubConnection](../functions/useHubConnection.md). It contains methods for sending messages,
subscribing to incoming messages, and controlling the connection lifecycle.

## Properties

### disconnect()

> **disconnect**: () => `void`

Defined in: [devtools-ui/src/types.ts:159](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L159)

Manually disconnect from the hub and cancel auto-reconnect.

#### Returns

`void`

***

### extensionId

> **extensionId**: `string`

Defined in: [devtools-ui/src/types.ts:146](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L146)

This panel's identity, as given to the hub at handshake.

#### Remarks

Stamped on every message the panel sends. It used to send an empty string, so the hub could
not tell one panel's commands from another's — with several open, or an authenticated hub
auditing who drove a store, there was nothing to attribute a time-travel or an injected
event to.

***

### reconnect()

> **reconnect**: () => `void`

Defined in: [devtools-ui/src/types.ts:161](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L161)

Reset reconnect attempts and establish a fresh connection.

#### Returns

`void`

***

### send()

> **send**: (`message`) => `void`

Defined in: [devtools-ui/src/types.ts:150](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L150)

Send a protocol message to the hub.

#### Parameters

##### message

`DevtoolsMessage`

#### Returns

`void`

***

### status

> **status**: [`HubConnectionStatus`](../type-aliases/HubConnectionStatus.md)

Defined in: [devtools-ui/src/types.ts:148](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L148)

Current connection status.

***

### subscribe()

> **subscribe**: (`handler`) => () => `void`

Defined in: [devtools-ui/src/types.ts:157](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L157)

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
