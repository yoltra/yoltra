![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / LoopbackHub

# Interface: LoopbackHub

Defined in: [devtools-ui/src/transport/loopback.ts:179](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L179)

A loopback hub instance. Wire the agent and the panel to the *same* instance.

## Properties

### agentSocketFactory

> **agentSocketFactory**: `DevtoolsSocketFactory`

Defined in: [devtools-ui/src/transport/loopback.ts:181](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L181)

Inject into the browser agent: `withDevtools(store, { socketFactory })`.

***

### WebSocket()

> **WebSocket**: (`url`) => `WebSocket`

Defined in: [devtools-ui/src/transport/loopback.ts:183](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L183)

Pass to the DevTools UI as `config.WebSocket` (e.g. `<DevtoolsApp>`).

#### Parameters

##### url

`string`

#### Returns

`WebSocket`
