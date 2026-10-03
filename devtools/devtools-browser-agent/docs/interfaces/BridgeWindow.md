![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-browser-agent**](../README.md)

***

[@yoltra/devtools-browser-agent](../README.md) / BridgeWindow

# Interface: BridgeWindow

Defined in: [postMessage-client.ts:63](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L63)

The window-like surface this transport needs, so a test can supply its own.

## Methods

### addEventListener()

> **addEventListener**(`type`, `listener`): `void`

Defined in: [postMessage-client.ts:65](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L65)

#### Parameters

##### type

`"message"`

##### listener

(`event`) => `void`

#### Returns

`void`

***

### postMessage()

> **postMessage**(`message`, `targetOrigin`): `void`

Defined in: [postMessage-client.ts:64](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L64)

#### Parameters

##### message

`unknown`

##### targetOrigin

`string`

#### Returns

`void`

***

### removeEventListener()

> **removeEventListener**(`type`, `listener`): `void`

Defined in: [postMessage-client.ts:66](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L66)

#### Parameters

##### type

`"message"`

##### listener

(`event`) => `void`

#### Returns

`void`
