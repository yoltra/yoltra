![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-browser-agent**](../README.md)

***

[@yoltra/devtools-browser-agent](../README.md) / createPostMessageSocketFactory

# Function: createPostMessageSocketFactory()

> **createPostMessageSocketFactory**(`target?`): `DevtoolsSocketFactory`

Defined in: [postMessage-client.ts:84](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-browser-agent/src/postMessage-client.ts#L84)

Builds a socket factory that carries the protocol over `window.postMessage`.

## Parameters

### target?

[`BridgeWindow`](../interfaces/BridgeWindow.md)

Window to post to and listen on. Defaults to the global `window`.

## Returns

`DevtoolsSocketFactory`

A factory for `withDevtools({ socketFactory })`.

## Remarks

The socket reports itself open immediately, because `postMessage` has no connection to
establish. That is not a claim that anybody is listening — if no relay is present the protocol
handshake simply goes unanswered, the client never resolves it, and messages buffer exactly as
they do against a hub that is not running. Failure to attach therefore looks the same whether
the panel is absent or the hub is down, which is one behaviour to explain rather than two.

Messages are posted with a `"*"` target origin and filtered by channel on receipt. The page is
posting to *itself* for a content script in the same frame to observe; there is no
cross-origin recipient to restrict to, and the content script is the trust boundary.

## Example

```ts
withDevtools(store, { socketFactory: createPostMessageSocketFactory() });
```
