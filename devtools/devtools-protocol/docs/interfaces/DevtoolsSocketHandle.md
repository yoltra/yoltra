[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / DevtoolsSocketHandle

# Interface: DevtoolsSocketHandle

Defined in: [ws-transport.ts:49](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L49)

Minimal socket handle the shared client operates on.

## Properties

### readyState

> `readonly` **readyState**: `number`

Defined in: [ws-transport.ts:51](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L51)

Standard WebSocket readyState (0=connecting, 1=open, 2=closing, 3=closed).

## Methods

### close()

> **close**(`code?`, `reason?`): `void`

Defined in: [ws-transport.ts:53](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L53)

#### Parameters

##### code?

`number`

##### reason?

`string`

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: [ws-transport.ts:55](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L55)

Detach every listener from the underlying socket.

#### Returns

`void`

***

### send()

> **send**(`data`): `void`

Defined in: [ws-transport.ts:52](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L52)

#### Parameters

##### data

`string`

#### Returns

`void`
