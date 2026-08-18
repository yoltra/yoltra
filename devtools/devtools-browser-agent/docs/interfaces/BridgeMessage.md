![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-browser-agent**](../README.md)

***

[@yoltra/devtools-browser-agent](../README.md) / BridgeMessage

# Interface: BridgeMessage

Defined in: [postMessage-client.ts:33](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L33)

One protocol frame travelling over `window.postMessage`.

## Properties

### channel

> `readonly` **channel**: `"yoltra-devtools-bridge"`

Defined in: [postMessage-client.ts:34](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L34)

***

### data

> `readonly` **data**: `string`

Defined in: [postMessage-client.ts:37](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L37)

A serialized DevTools protocol message.

***

### direction

> `readonly` **direction**: [`BridgeDirection`](../type-aliases/BridgeDirection.md)

Defined in: [postMessage-client.ts:35](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L35)
