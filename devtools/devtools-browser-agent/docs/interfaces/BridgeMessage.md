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

### closed?

> `readonly` `optional` **closed**: `true`

Defined in: [postMessage-client.ts:50](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L50)

Set on the frame a socket posts when it closes, so the relay can end that connection.

***

### connection?

> `readonly` `optional` **connection**: `string`

Defined in: [postMessage-client.ts:48](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L48)

Which of the page's sockets the frame belongs to.

#### Remarks

Every store on a page posts into the same window, so without this the relay sees one stream
where a hub would see one connection per store. Each socket stamps its frames to the panel
with its own id, and accepts a frame to the page only when it carries that id or none. A
relay keeps one connection per id, which lets several stores on one page register, and be
addressed, separately.

***

### data

> `readonly` **data**: `string`

Defined in: [postMessage-client.ts:37](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L37)

A serialized DevTools protocol message. Empty on a `closed` notice.

***

### direction

> `readonly` **direction**: [`BridgeDirection`](../type-aliases/BridgeDirection.md)

Defined in: [postMessage-client.ts:35](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L35)
