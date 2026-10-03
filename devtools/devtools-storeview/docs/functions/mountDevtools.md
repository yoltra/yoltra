![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-storeview**](../README.md)

***

[@yoltra/devtools-storeview](../README.md) / mountDevtools

# Function: mountDevtools()

> **mountDevtools**(`container`, `config`): () => `void`

Defined in: [devtools-storeview/src/index.tsx:32](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-storeview/src/index.tsx#L32)

Mount the DevTools React app into a DOM container.

## Parameters

### container

`HTMLElement`

The DOM element to mount into.

### config

`HubConnectionConfig`

Hub connection configuration. For a hub started with a token, include the same
value as `authToken`.

## Returns

An unmount function.

> (): `void`

### Returns

`void`
