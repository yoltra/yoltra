![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-browser-agent**](../README.md)

***

[@yoltra/devtools-browser-agent](../README.md) / BridgeWindow

# Interface: BridgeWindow

Defined in: [postMessage-client.ts:50](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L50)

The window-like surface this transport needs, so a test can supply its own.

## Methods

### addEventListener()

> **addEventListener**(`type`, `listener`): `void`

Defined in: [postMessage-client.ts:52](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L52)

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

Defined in: [postMessage-client.ts:51](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L51)

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

Defined in: [postMessage-client.ts:53](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L53)

#### Parameters

##### type

`"message"`

##### listener

(`event`) => `void`

#### Returns

`void`
