![Yoltra logo](https://yoltra.dev/assets/yoltra-logo.png)

[**@yoltra/devtools-ui**](../README.md)

***

[@yoltra/devtools-ui](../README.md) / LoopbackHub

# Interface: LoopbackHub

Defined in: [devtools-ui/src/transport/loopback.ts:165](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L165)

A loopback hub instance. Wire the agent and the panel to the *same* instance.

## Properties

### agentSocketFactory

> **agentSocketFactory**: `DevtoolsSocketFactory`

Defined in: [devtools-ui/src/transport/loopback.ts:167](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L167)

Inject into the browser agent: `withDevtools(store, { socketFactory })`.

***

### WebSocket()

> **WebSocket**: (`url`) => `WebSocket`

Defined in: [devtools-ui/src/transport/loopback.ts:169](https://github.com/yoltra/yoltra/blob/main/devtools/devtools-ui/src/transport/loopback.ts#L169)

Pass to the DevTools UI as `config.WebSocket` (e.g. `<DevtoolsApp>`).

#### Parameters

##### url

`string`

#### Returns

`WebSocket`
