![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / ReconnectingWsClient

# Class: ReconnectingWsClient

Defined in: [ws-transport.ts:98](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L98)

Reconnecting WebSocket client that connects a Yoltra store to the DevTools hub.

## Remarks

- Performs the DevTools protocol handshake on each connection.
- Buffers outgoing messages (up to 100) while disconnected, dropping the oldest.
- Uses exponential backoff with jitter for reconnection attempts.
- Tracks connection epochs to safely discard stale callbacks.
- Transport-agnostic: the socket is created by the injected factory.

## Constructors

### Constructor

> **new ReconnectingWsClient**(`storeId`, `storeName`, `capabilities`, `config`, `createSocket`): `ReconnectingWsClient`

Defined in: [ws-transport.ts:114](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L114)

#### Parameters

##### storeId

`string`

##### storeName

`string`

##### capabilities

[`StoreCapabilities`](../interfaces/StoreCapabilities.md)

##### config

[`ReconnectingWsConfig`](../interfaces/ReconnectingWsConfig.md)

##### createSocket

[`DevtoolsSocketFactory`](../type-aliases/DevtoolsSocketFactory.md)

#### Returns

`ReconnectingWsClient`

## Methods

### connect()

> **connect**(`host`, `port`): `void`

Defined in: [ws-transport.ts:147](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L147)

Connect to the DevTools hub at `host:port`.

#### Parameters

##### host

`string`

##### port

`number`

#### Returns

`void`

***

### disconnect()

> **disconnect**(): `void`

Defined in: [ws-transport.ts:170](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L170)

Disconnect and stop reconnection attempts.

#### Returns

`void`

***

### getDroppedCount()

> **getDroppedCount**(): `number`

Defined in: [ws-transport.ts:192](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L192)

Total messages dropped due to buffer overflow while disconnected.

#### Returns

`number`

***

### getState()

> **getState**(): [`ConnectionState`](../type-aliases/ConnectionState.md)

Defined in: [ws-transport.ts:187](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L187)

Current connection state.

#### Returns

[`ConnectionState`](../type-aliases/ConnectionState.md)

***

### onBackpressure()

> **onBackpressure**(`handler`): `void`

Defined in: [ws-transport.ts:142](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L142)

Register a handler fired when a buffered message is dropped because the send
buffer overflowed while disconnected (backpressure). Receives the running
total of dropped messages so the loss is never silent.

#### Parameters

##### handler

(`droppedTotal`) => `void`

#### Returns

`void`

***

### onConnected()

> **onConnected**(`handler`): `void`

Defined in: [ws-transport.ts:128](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L128)

Register a handler for successful connection (post-handshake).

#### Parameters

##### handler

() => `void`

#### Returns

`void`

***

### onDisconnected()

> **onDisconnected**(`handler`): `void`

Defined in: [ws-transport.ts:133](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L133)

Register a handler for disconnection.

#### Parameters

##### handler

() => `void`

#### Returns

`void`

***

### onMessage()

> **onMessage**(`handler`): `void`

Defined in: [ws-transport.ts:123](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L123)

Register a handler for incoming messages (post-handshake).

#### Parameters

##### handler

(`data`) => `void`

#### Returns

`void`

***

### send()

> **send**(`message`): `void`

Defined in: [ws-transport.ts:155](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L155)

Send a message, buffering (FIFO) while disconnected; drops oldest on overflow.

#### Parameters

##### message

`string`

#### Returns

`void`
