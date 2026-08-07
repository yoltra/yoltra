[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / DevtoolsSocketCallbacks

# Interface: DevtoolsSocketCallbacks

Defined in: [ws-transport.ts:41](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L41)

Lifecycle callbacks the transport wires to the underlying socket.

## Methods

### onClose()

> **onClose**(): `void`

Defined in: [ws-transport.ts:44](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L44)

#### Returns

`void`

***

### onError()

> **onError**(): `void`

Defined in: [ws-transport.ts:45](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L45)

#### Returns

`void`

***

### onMessage()

> **onMessage**(`data`): `void`

Defined in: [ws-transport.ts:43](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L43)

#### Parameters

##### data

`string`

#### Returns

`void`

***

### onOpen()

> **onOpen**(): `void`

Defined in: [ws-transport.ts:42](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-protocol/src/ws-transport.ts#L42)

#### Returns

`void`
