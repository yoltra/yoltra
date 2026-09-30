![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / HubContextValue

# Interface: HubContextValue

Defined in: [devtools-ui/src/types.ts:146](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L146)

Hub connection context value provided to consumers.

## Remarks

This is the shape of the value exposed by [HubContext](../variables/HubContext.md) and consumed
via [useHubConnection](../functions/useHubConnection.md). It contains methods for sending messages,
subscribing to incoming messages, and controlling the connection lifecycle.

## Properties

### disconnect()

> **disconnect**: () => `void`

Defined in: [devtools-ui/src/types.ts:169](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L169)

Manually disconnect from the hub and cancel auto-reconnect.

#### Returns

`void`

***

### extensionId

> **extensionId**: `string`

Defined in: [devtools-ui/src/types.ts:156](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L156)

This panel's identity, as given to the hub at handshake.

#### Remarks

Stamped on every message the panel sends. It used to send an empty string, so the hub could
not tell one panel's commands from another's — with several open, or an authenticated hub
auditing who drove a store, there was nothing to attribute a time-travel or an injected
event to.

***

### reconnect()

> **reconnect**: () => `void`

Defined in: [devtools-ui/src/types.ts:171](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L171)

Reset reconnect attempts and establish a fresh connection.

#### Returns

`void`

***

### send()

> **send**: (`message`) => `void`

Defined in: [devtools-ui/src/types.ts:160](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L160)

Send a protocol message to the hub.

#### Parameters

##### message

`DevtoolsMessage`

#### Returns

`void`

***

### status

> **status**: [`HubConnectionStatus`](../type-aliases/HubConnectionStatus.md)

Defined in: [devtools-ui/src/types.ts:158](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L158)

Current connection status.

***

### subscribe()

> **subscribe**: (`handler`) => () => `void`

Defined in: [devtools-ui/src/types.ts:167](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/types.ts#L167)

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
