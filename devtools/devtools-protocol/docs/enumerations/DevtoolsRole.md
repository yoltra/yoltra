[**@yoltra/devtools-protocol**](../README.md)

***

[@yoltra/devtools-protocol](../README.md) / DevtoolsRole

# Enumeration: DevtoolsRole

Defined in: [roles.ts:22](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/roles.ts#L22)

Roles that a WebSocket client can assume when connecting to the DevTools hub.

## Remarks

Every client that opens a WebSocket to the hub must declare exactly one role
during the [HandshakeRequest](../interfaces/HandshakeRequest.md). The hub uses this role to determine
message routing: store messages are forwarded to extensions and vice-versa.

## Example

```ts
import { DevtoolsRole } from "@yoltra/devtools-protocol";

const role = DevtoolsRole.STORE;
```

## Enumeration Members

### EXTENSION

> **EXTENSION**: `"extension"`

Defined in: [roles.ts:26](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/roles.ts#L26)

A DevTools UI (browser extension, VSCode panel, CLI) consuming store data.

***

### HUB

> **HUB**: `"hub"`

Defined in: [roles.ts:28](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/roles.ts#L28)

The Hub server

***

### STORE

> **STORE**: `"store"`

Defined in: [roles.ts:24](https://github.com/yoltra/yoltra/blob/5ed5f4e4cc19d06832097c4012b16d8a869f58c3/devtools/devtools-protocol/src/roles.ts#L24)

A Yoltra store instance reporting events and state.
